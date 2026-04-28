"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { socket } from "@/core/socket/socket";
import { useIdentity } from "@/app/context/IdentityContext";

type Room = {
  roomId: string;
  name: string;
};

export default function GroupSidebar() {
  const { identity } = useIdentity();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRoom = searchParams.get("room") || "general";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    if (!identity) return;

    socket.auth = identity;

    if (!socket.connected) {
      socket.connect();
    }
  }, [identity]);

  useEffect(() => {
    if (!identity) return;

    socket.emit("get_rooms");

    const handleRooms = (data: Room[]) => {
      setRooms(data);
    };

    const handleCreated = (room: Room) => {
      setRooms((prev) => {
        const exists = prev.some((r) => r.roomId === room.roomId);
        if (exists) return prev;
        return [...prev, room];
      });
    };

    const handleInvite = ({ link }: { link: string }) => {
      console.log("[UI] invite received:", link);
      setInviteLink(link);
    };

    socket.on("rooms_list", handleRooms);
    socket.on("room_created", handleCreated);
    socket.on("invite_created", handleInvite);

    return () => {
      socket.off("rooms_list", handleRooms);
      socket.off("room_created", handleCreated);
      socket.off("invite_created", handleInvite);
    };
  }, [identity]);

  const createRoom = () => {
    if (!newRoom.trim()) return;

    const roomId = newRoom.trim().toLowerCase().replace(/\s+/g, "-");

    socket.emit("create_room", {
      roomId,
      name: newRoom,
    });

    setNewRoom("");
  };

  const joinRoom = (roomId: string) => {
    router.push(`/chat?room=${roomId}`);
  };

  const createInvite = (roomId: string) => {
    console.log("[UI] createInvite clicked:", roomId);
    socket.emit("create_invite", { roomId });
  };

  const copyInvite = async () => {
    if (!inviteLink) return;

    await navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied!");
  };

  return (
    <div className="w-64 border-r p-3 flex flex-col gap-3">
      <h2 className="font-bold">Groups</h2>

      <div className="flex gap-2">
        <input
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          placeholder="New room"
          className="flex-1 border p-1 rounded"
        />
        <button
          onClick={createRoom}
          className="px-2 bg-black text-white rounded"
        >
          +
        </button>
      </div>

      <div className="space-y-2">
        {rooms.map((room) => (
          <div
            key={room.roomId}
            className={`p-2 rounded cursor-pointer flex justify-between items-center ${
              currentRoom === room.roomId ? "bg-gray-200" : "hover:bg-gray-100"
            }`}
          >
            <span onClick={() => joinRoom(room.roomId)}>{room.name}</span>

            <button
              onClick={() => createInvite(room.roomId)}
              className="text-xs text-blue-500"
            >
              invite
            </button>
          </div>
        ))}
      </div>

      {inviteLink && (
        <div className="mt-4 p-2 border rounded bg-gray-50">
          <p className="text-xs mb-2">Invite link ready:</p>

          <input
            className="w-full text-xs p-1 border rounded"
            value={inviteLink}
            readOnly
          />

          <button
            onClick={copyInvite}
            className="mt-2 w-full text-xs bg-black text-white p-1 rounded"
          >
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
