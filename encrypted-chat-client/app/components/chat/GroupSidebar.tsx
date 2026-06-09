"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { connectSocket, socket } from "@/core/socket/socket";
import { emitWithAck } from "@/core/socket/emit-with-ack";
import { useIdentity } from "@/app/context/IdentityContext";
import { exportRoomKey, getOrCreateRoomKey } from "@/core/crypto/encryption";
import { buildInviteUrl } from "@/core/invite/invite-key";
import InviteLinkBox from "./InviteLinkBox";
import RoomList from "./RoomList";
import type { InviteCreatedPayload, Room } from "./sidebar-types";

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

  const addRoom = useCallback((room: Room) => {
    setRooms((prev) => {
      const exists = prev.some((r) => r.roomId === room.roomId);
      if (exists) return prev;
      return [...prev, room];
    });
  }, []);

  const handleInviteCreated = useCallback(
    async ({ roomId, intent, link }: InviteCreatedPayload) => {
      await getOrCreateRoomKey(roomId);

      const roomKey = await exportRoomKey(roomId);
      const inviteUrl = buildInviteUrl(link, roomKey);

      console.log("[UI] invite received:", inviteUrl);
      setInviteLink(inviteUrl);

      if (intent === "direct-call") {
        setCreatingCall(false);
        setCallError(null);
        router.push(`/chat?room=${roomId}&mode=call`);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!identity) return;

    const handleRooms = (data: Room[]) => {
      setRooms(data);
    };

    const handleCreated = (room: Room) => {
      addRoom(room);
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

    socket.on("rooms_list", handleRooms);
    socket.on("room_created", handleCreated);
    socket.on("room_create_failed", handleRoomFailed);
    socket.on("room_deleted", handleDeleted);
    socket.on("call_create_failed", handleCallFailed);
    socket.on("invite_created", handleInviteCreated);

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
      socket.off("invite_created", handleInviteCreated);
    };
  }, [addRoom, handleInviteCreated, identity, router]);

  const createRoom = async () => {
    if (!identity || !newRoom.trim() || creatingRoom) return;

    const slug = newRoom.trim().toLowerCase().replace(/\s+/g, "-");
    const roomId = `${slug}-${crypto.randomUUID().slice(0, 8)}`;

    setCreatingRoom(true);
    setRoomError(null);

    try {
      await connectSocket(identity);
      await getOrCreateRoomKey(roomId);

      const response = await emitWithAck<{ room: Room }>("create_room", {
        roomId,
        name: newRoom,
      });

      if (!response.ok) {
        throw new Error(response.message || "Could not create the group.");
      }

      addRoom(response.room);
      router.push(`/chat?room=${response.room.roomId}`);

      setNewRoom("");
      setCreatingRoom(false);
      setRoomError(null);
    } catch (error) {
      console.error("[UI] create group failed:", error);
      setRoomError(
        error instanceof Error
          ? error.message
          : "Could not connect to create the group.",
      );
      setCreatingRoom(false);
    }
  };

  const joinRoomFromList = (room: Room) => {
    const mode = room.kind === "direct-call" ? "&mode=call" : "";
    router.push(`/chat?room=${room.roomId}${mode}`);
  };

  const createInvite = async (roomId: string) => {
    if (!identity) return;

    console.log("[UI] createInvite clicked:", roomId);
    setRoomError(null);

    try {
      await connectSocket(identity);

      const response = await emitWithAck<{ invite: InviteCreatedPayload }>(
        "create_invite",
        { roomId, intent: "group" },
      );

      if (!response.ok) {
        throw new Error(response.message || "Could not create the invite.");
      }

      await handleInviteCreated(response.invite);
    } catch (error) {
      console.error("[UI] create invite failed:", error);
      setRoomError(
        error instanceof Error
          ? error.message
          : "Could not connect to create the invite.",
      );
    }
  };

  const createCallInvite = async () => {
    if (!identity || creatingCall) return;

    setCreatingCall(true);
    setCallError(null);

    try {
      await connectSocket(identity);

      const response = await emitWithAck<{
        room: Room;
        invite: InviteCreatedPayload;
      }>("create_call_invite", {
        label: `${identity.username}'s private call`,
      });

      if (!response.ok) {
        throw new Error(response.message || "Could not create the call.");
      }

      addRoom(response.room);
      await handleInviteCreated(response.invite);
    } catch (error) {
      console.error("[UI] create call failed:", error);
      setCallError(
        error instanceof Error
          ? error.message
          : "Could not connect to create the call.",
      );
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

      <RoomList
        rooms={rooms}
        currentRoom={currentRoom}
        onJoinRoom={joinRoomFromList}
        onCreateInvite={(roomId) => void createInvite(roomId)}
      />

      {inviteLink && (
        <InviteLinkBox inviteLink={inviteLink} onCopy={() => void copyInvite()} />
      )}
    </div>
  );
}
