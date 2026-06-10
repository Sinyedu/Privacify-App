"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import InviteLinkBox from "./InviteLinkBox";
import RoomMembers from "./RoomMembers";
import RoomList from "./RoomList";
import type { Room } from "./sidebar-types";
import { useRoomManager } from "./useRoomManager";

export default function GroupSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRoom = searchParams.get("room");

  const openGroup = useCallback(
    (roomId: string) => router.push(`/chat?room=${roomId}`),
    [router],
  );

  const openCall = useCallback(
    (roomId: string) => router.push(`/chat?room=${roomId}&mode=call`),
    [router],
  );

  const handleLeaveGroup = useCallback(
    (roomId: string) => {
      if (currentRoom === roomId) {
        router.push("/chat");
      }
    },
    [currentRoom, router],
  );

  const {
    rooms,
    inviteLink,
    roomError,
    createInvite,
    leaveGroup,
    copyInvite,
  } = useRoomManager({
    onOpenGroup: openGroup,
    onOpenCall: openCall,
    onLeaveGroup: handleLeaveGroup,
  });

  const joinRoomFromList = (room: Room) => {
    if (room.kind === "direct-call") {
      openCall(room.roomId);
      return;
    }

    openGroup(room.roomId);
  };

  const selectedRoom = rooms.find((room) => room.roomId === currentRoom);

  return (
    <div className="w-64 border-r p-3 flex flex-col gap-3">
      <h2 className="font-bold">Rooms</h2>

      {roomError && <div className="text-sm text-red-600">{roomError}</div>}

      <RoomList
        rooms={rooms}
        currentRoom={currentRoom}
        onJoinRoom={joinRoomFromList}
        onCreateInvite={(roomId) => void createInvite(roomId)}
        onLeaveRoom={(roomId) => void leaveGroup(roomId)}
      />

      <RoomMembers room={selectedRoom} />

      {inviteLink && (
        <InviteLinkBox
          inviteLink={inviteLink}
          onCopy={() => {
            void copyInvite();
          }}
        />
      )}
    </div>
  );
}
