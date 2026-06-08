"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { connectSocket, socket } from "@/core/socket/socket";
import { useIdentity } from "@/app/context/IdentityContext";
import { exportRoomKey, getOrCreateRoomKey } from "@/core/crypto/encryption";

type Room = {
  roomId: string;
  name: string;
  kind?: "group" | "direct-call";
};

type InviteCreatedPayload = {
  roomId: string;
  intent?: "group" | "direct-call";
  link: string;
};

export default function GroupSidebar() {
  const { identity } = useIdentity();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRoom = searchParams.get("room");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [creatingCall, setCreatingCall] = useState(false);

  useEffect(() => {
    if (!identity) return;

    const handleRooms = (data: Room[]) => {
      setRooms(data);
    };

    const handleCreated = (room: Room) => {
      setRooms((prev) => {
        const exists = prev.some((r) => r.roomId === room.roomId);
        if (exists) return prev;
        return [...prev, room];
      });
      setCreatingRoom(false);
      setRoomError(null);

      if (room.kind !== "direct-call") {
        router.push(`/chat?room=${room.roomId}`);
      }
    };

    const handleDeleted = ({ roomId }: { roomId: string }) => {
      setRooms((prev) => prev.filter((room) => room.roomId !== roomId));
    };

    const handleRoomFailed = ({ message }: { message?: string }) => {
      setCreatingRoom(false);
      setRoomError(message || "Failed to create group");
    };

    const handleCallFailed = ({ message }: { message?: string }) => {
      setCreatingCall(false);
      setCallError(message || "Failed to create call");
    };

    const handleInvite = async ({ roomId, intent, link }: InviteCreatedPayload) => {
      await getOrCreateRoomKey(roomId);

      const roomKey = await exportRoomKey(roomId);
      const baseInviteUrl = new URL(link, window.location.origin).toString();
      const inviteUrl = roomKey
        ? `${baseInviteUrl}#key=${encodeURIComponent(roomKey)}`
        : baseInviteUrl;

      console.log("[UI] invite received:", inviteUrl);
      setInviteLink(inviteUrl);

      if (intent === "direct-call") {
        setCreatingCall(false);
        setCallError(null);
        router.push(`/chat?room=${roomId}&mode=call`);
      }
    };

    socket.on("rooms_list", handleRooms);
    socket.on("room_created", handleCreated);
    socket.on("room_create_failed", handleRoomFailed);
    socket.on("room_deleted", handleDeleted);
    socket.on("call_create_failed", handleCallFailed);
    socket.on("invite_created", handleInvite);

    void connectSocket(identity)
      .then(() => {
        socket.emit("get_rooms");
      })
      .catch((error) => {
        console.error("[socket] failed to connect:", error);
        setRoomError("Could not connect to load groups.");
        setCallError("Could not connect to create calls.");
      });

    return () => {
      socket.off("rooms_list", handleRooms);
      socket.off("room_created", handleCreated);
      socket.off("room_create_failed", handleRoomFailed);
      socket.off("room_deleted", handleDeleted);
      socket.off("call_create_failed", handleCallFailed);
      socket.off("invite_created", handleInvite);
    };
  }, [identity, router]);

  const createRoom = async () => {
    if (!identity || !newRoom.trim() || creatingRoom) return;

    const slug = newRoom.trim().toLowerCase().replace(/\s+/g, "-");
    const roomId = `${slug}-${crypto.randomUUID().slice(0, 8)}`;

    setCreatingRoom(true);
    setRoomError(null);

    try {
      await connectSocket(identity);
      await getOrCreateRoomKey(roomId);

      socket.emit("create_room", {
        roomId,
        name: newRoom,
      });

      setNewRoom("");
    } catch (error) {
      console.error("[UI] create group failed:", error);
      setRoomError("Could not connect to create the group.");
      setCreatingRoom(false);
    }
  };

  const joinRoomFromList = (room: Room) => {
    const mode = room.kind === "direct-call" ? "&mode=call" : "";
    router.push(`/chat?room=${room.roomId}${mode}`);
  };

  const createInvite = (roomId: string) => {
    if (!identity) return;

    console.log("[UI] createInvite clicked:", roomId);
    void connectSocket(identity)
      .then(() => {
        socket.emit("create_invite", { roomId, intent: "group" });
      })
      .catch((error) => {
        console.error("[UI] create invite failed:", error);
        setRoomError("Could not connect to create the invite.");
      });
  };

  const createCallInvite = async () => {
    if (!identity || creatingCall) return;

    setCreatingCall(true);
    setCallError(null);

    try {
      await connectSocket(identity);
      socket.emit("create_call_invite", {
        label: `${identity.username}'s private call`,
      });
    } catch (error) {
      console.error("[UI] create call failed:", error);
      setCallError("Could not connect to create the call.");
      setCreatingCall(false);
    }
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
          onClick={() => void createRoom()}
          disabled={!identity || creatingRoom}
          className="px-2 bg-black text-white rounded disabled:opacity-50"
        >
          {creatingRoom ? "..." : "+"}
        </button>
      </div>

      {roomError && <div className="text-sm text-red-600">{roomError}</div>}

      <button
        onClick={() => void createCallInvite()}
        disabled={!identity || creatingCall}
        className="w-full text-sm bg-neutral-900 text-white p-2 rounded"
      >
        {creatingCall ? "Creating call..." : "Create call link"}
      </button>

      {callError && <div className="text-sm text-red-600">{callError}</div>}

      <div className="space-y-2">
        {rooms.map((room) => (
          <div
            key={room.roomId}
            className={[
              "p-2 rounded cursor-pointer flex justify-between items-center border",
              currentRoom === room.roomId
                ? room.kind === "direct-call"
                  ? "bg-neutral-950 text-white border-neutral-950"
                  : "bg-gray-900 text-white border-gray-900"
                : "border-transparent hover:bg-gray-100",
            ].join(" ")}
          >
            <span onClick={() => joinRoomFromList(room)} className="min-w-0">
              {room.name}
              {room.kind === "direct-call" && (
                <span
                  className={[
                    "ml-2 text-[10px] uppercase",
                    currentRoom === room.roomId ? "text-red-300" : "text-gray-500",
                  ].join(" ")}
                >
                  call
                </span>
              )}
            </span>

            {room.kind !== "direct-call" && (
              <button
                onClick={() => createInvite(room.roomId)}
                className={[
                  "text-xs",
                  currentRoom === room.roomId ? "text-blue-200" : "text-blue-500",
                ].join(" ")}
              >
                invite
              </button>
            )}
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
