"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import InviteLinkBox from "@/app/components/chat/InviteLinkBox";
import type { Room } from "@/app/components/chat/sidebar-types";
import { useRoomManager } from "@/app/components/chat/useRoomManager";

type RoomSectionProps = {
  title: string;
  rooms: Room[];
  emptyText: string;
  onOpenRoom: (room: Room) => void;
  onCreateInvite: (roomId: string) => void;
  onLeaveRoom: (roomId: string) => void;
  onDeleteCall: (roomId: string) => void;
};

function RoomSection({
  title,
  rooms,
  emptyText,
  onOpenRoom,
  onCreateInvite,
  onLeaveRoom,
  onDeleteCall,
}: RoomSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h2>

      {rooms.length === 0 ? (
        <div className="rounded border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-2">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              className="rounded border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{room.name}</div>
                  <div className="text-xs text-neutral-500">
                    {room.kind === "direct-call"
                      ? room.roomId
                      : `${room.members?.length ?? 0} members`}
                  </div>
                  {room.kind !== "direct-call" && Boolean(room.members?.length) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {room.members?.map((member) => (
                        <span
                          key={member.userId}
                          className="rounded bg-neutral-100 px-2 py-1 text-[11px] text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                        >
                          {member.username}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => onCreateInvite(room.roomId)}
                    className="rounded border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
                  >
                    Invite
                  </button>
                  {room.kind !== "direct-call" && (
                    <button
                      onClick={() => onLeaveRoom(room.roomId)}
                      className="rounded border border-red-300 px-3 py-2 text-xs text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      Leave
                    </button>
                  )}
                  {room.kind === "direct-call" && (
                    <button
                      onClick={() => onDeleteCall(room.roomId)}
                      className="rounded border border-red-300 px-3 py-2 text-xs text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => onOpenRoom(room)}
                    className="rounded bg-neutral-950 px-3 py-2 text-xs text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function GroupsClient() {
  const router = useRouter();
  const [newGroupName, setNewGroupName] = useState("");

  const openCall = (roomId: string) => {
    router.push(`/calls/${roomId}`);
  };

  const {
    identity,
    rooms,
    inviteLink,
    inviteRoomId,
    roomError,
    callError,
    creatingRoom,
    creatingCall,
    createGroup,
    createInvite,
    createCallInvite,
    leaveGroup,
    deleteCall,
    copyInvite,
  } = useRoomManager({ onOpenCall: openCall, openCallOnInvite: false });

  const groups = useMemo(
    () => rooms.filter((room) => room.kind !== "direct-call"),
    [rooms],
  );
  const calls = useMemo(
    () => rooms.filter((room) => room.kind === "direct-call"),
    [rooms],
  );

  const openRoom = (room: Room) => {
    if (room.kind === "direct-call") {
      openCall(room.roomId);
      return;
    }

    router.push(`/chat?room=${room.roomId}`);
  };

  const submitGroup = async () => {
    const created = await createGroup(newGroupName);
    if (created) setNewGroupName("");
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6">
        <header className="flex flex-col gap-3 border-b border-neutral-200 pb-5 dark:border-neutral-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Groups</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage group rooms and private call links.
            </p>
          </div>

          <button
            onClick={() => void createCallInvite()}
            disabled={!identity || creatingCall}
            className="rounded bg-neutral-950 px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            {creatingCall ? "Creating call..." : "Create call link"}
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <h2 className="text-sm font-semibold">Create group</h2>
              <div className="mt-3 flex gap-2">
                <input
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  placeholder="Group name"
                  className="min-w-0 flex-1 rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  onClick={() => void submitGroup()}
                  disabled={!identity || creatingRoom || !newGroupName.trim()}
                  className="rounded bg-neutral-950 px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                >
                  {creatingRoom ? "Creating..." : "Create"}
                </button>
              </div>
              {roomError && (
                <div className="mt-3 text-sm text-red-600">{roomError}</div>
              )}
            </section>

            <RoomSection
              title="Groups"
              rooms={groups}
              emptyText="No groups yet."
              onOpenRoom={openRoom}
              onCreateInvite={(roomId) => void createInvite(roomId)}
              onLeaveRoom={(roomId) => void leaveGroup(roomId)}
              onDeleteCall={(roomId) => void deleteCall(roomId)}
            />

            <RoomSection
              title="Calls"
              rooms={calls}
              emptyText="No active call rooms yet."
              onOpenRoom={openRoom}
              onCreateInvite={(roomId) => void createInvite(roomId, "direct-call")}
              onLeaveRoom={(roomId) => void leaveGroup(roomId)}
              onDeleteCall={(roomId) => void deleteCall(roomId)}
            />
          </div>

          <aside className="space-y-4">
            {callError && <div className="text-sm text-red-600">{callError}</div>}
            {inviteLink ? (
              <>
                <InviteLinkBox
                  inviteLink={inviteLink}
                  onCopy={() => {
                    void copyInvite();
                  }}
                />
                {inviteRoomId && (
                  <button
                    onClick={() => openCall(inviteRoomId)}
                    className="w-full rounded bg-neutral-950 px-4 py-2 text-sm text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                  >
                    Open call
                  </button>
                )}
              </>
            ) : (
              <div className="rounded border border-neutral-200 bg-white p-4 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
                Invite links appear here after you create one.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
