import type { Room } from "./sidebar-types";

type RoomMembersProps = {
  room?: Room;
};

export default function RoomMembers({ room }: RoomMembersProps) {
  if (!room || room.kind === "direct-call") return null;

  const members = room.members ?? [];

  return (
    <section className="border-t pt-3">
      <h3 className="mb-2 text-xs font-semibold uppercase text-neutral-500">
        Members
      </h3>
      {members.length === 0 ? (
        <div className="text-xs text-neutral-500">No members loaded.</div>
      ) : (
        <div className="space-y-1">
          {members.map((member) => (
            <div
              key={member.userId}
              className="truncate rounded bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-900"
            >
              {member.username}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
