"use client";

import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/app/context/IdentityContext";
import { exportRoomKey, getOrCreateRoomKey } from "@/core/crypto/encryption";
import { buildInviteUrl } from "@/core/invite/invite-key";
import { emitWithAck } from "@/core/socket/emit-with-ack";
import { connectSocket, socket } from "@/core/socket/socket";
import type { InviteCreatedPayload, Room } from "./sidebar-types";

type UseRoomManagerOptions = {
  onOpenGroup?: (roomId: string) => void;
  onOpenCall?: (roomId: string) => void;
  onLeaveGroup?: (roomId: string) => void;
};

export function useRoomManager({
  onOpenGroup,
  onOpenCall,
  onLeaveGroup,
}: UseRoomManagerOptions = {}) {
  const { identity } = useIdentity();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
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

      setInviteLink(inviteUrl);

      if (intent === "direct-call") {
        setCreatingCall(false);
        setCallError(null);
        onOpenCall?.(roomId);
      }
    },
    [onOpenCall],
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
        onOpenGroup?.(room.roomId);
      }
    };

    const handleDeleted = ({ roomId }: { roomId: string }) => {
      setRooms((prev) => prev.filter((room) => room.roomId !== roomId));
    };

    const handleLeft = ({ roomId }: { roomId: string }) => {
      setRooms((prev) => prev.filter((room) => room.roomId !== roomId));
      onLeaveGroup?.(roomId);
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
    socket.on("room_left", handleLeft);
    socket.on("call_create_failed", handleCallFailed);
    socket.on("invite_created", handleInviteCreated);

    void connectSocket(identity)
      .then(() => socket.emit("get_rooms"))
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
      socket.off("room_left", handleLeft);
      socket.off("call_create_failed", handleCallFailed);
      socket.off("invite_created", handleInviteCreated);
    };
  }, [addRoom, handleInviteCreated, identity, onLeaveGroup, onOpenGroup]);

  const createGroup = useCallback(
    async (name: string) => {
      if (!identity || !name.trim() || creatingRoom) return false;

      const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
      const roomId = `${slug}-${crypto.randomUUID().slice(0, 8)}`;

      setCreatingRoom(true);
      setRoomError(null);

      try {
        await connectSocket(identity);
        await getOrCreateRoomKey(roomId);

        const response = await emitWithAck<{ room: Room }>("create_room", {
          roomId,
          name,
        });

        if (!response.ok) {
          throw new Error(response.message || "Could not create the group.");
        }

        addRoom(response.room);
        onOpenGroup?.(response.room.roomId);
        setCreatingRoom(false);
        setRoomError(null);
        return true;
      } catch (error) {
        console.error("[UI] create group failed:", error);
        setRoomError(
          error instanceof Error
            ? error.message
            : "Could not connect to create the group.",
        );
        setCreatingRoom(false);
        return false;
      }
    },
    [addRoom, creatingRoom, identity, onOpenGroup],
  );

  const createInvite = useCallback(
    async (roomId: string) => {
      if (!identity) return;

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
    },
    [handleInviteCreated, identity],
  );

  const createCallInvite = useCallback(async () => {
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
        error instanceof Error ? error.message : "Could not connect to create the call.",
      );
      setCreatingCall(false);
    }
  }, [addRoom, creatingCall, handleInviteCreated, identity]);

  const leaveGroup = useCallback(
    async (roomId: string) => {
      if (!identity) return false;

      setRoomError(null);

      try {
        await connectSocket(identity);

        const response = await emitWithAck<{ roomId: string; deleted: boolean }>(
          "leave_group",
          { roomId },
        );

        if (!response.ok) {
          throw new Error(response.message || "Could not leave the group.");
        }

        setRooms((prev) => prev.filter((room) => room.roomId !== response.roomId));
        onLeaveGroup?.(response.roomId);
        return true;
      } catch (error) {
        console.error("[UI] leave group failed:", error);
        setRoomError(
          error instanceof Error
            ? error.message
            : "Could not connect to leave the group.",
        );
        return false;
      }
    },
    [identity, onLeaveGroup],
  );

  const copyInvite = useCallback(async () => {
    if (!inviteLink) return;

    await navigator.clipboard.writeText(inviteLink);
  }, [inviteLink]);

  return {
    identity,
    rooms,
    inviteLink,
    roomError,
    callError,
    creatingRoom,
    creatingCall,
    createGroup,
    createInvite,
    createCallInvite,
    leaveGroup,
    copyInvite,
  };
}
