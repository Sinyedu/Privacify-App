import type { Room } from "./sidebar-types";

type RoomListProps = {
  rooms: Room[];
  currentRoom: string | null;
  onJoinRoom: (room: Room) => void;
  onCreateInvite: (room: Room) => void;
  onLeaveRoom?: (roomId: string) => void;
  onDeleteCall?: (roomId: string) => void;
};

export default function RoomList({
  rooms,
  currentRoom,
  onJoinRoom,
  onCreateInvite,
  onLeaveRoom,
  onDeleteCall,
}: RoomListProps) {
  return (
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
          <button
            onClick={() => onJoinRoom(room)}
            className="min-w-0 text-left"
          >
            <span className="block truncate text-sm">{room.name}</span>
            <span
              className={[
                "block text-[11px]",
                currentRoom === room.roomId ? "text-neutral-300" : "text-gray-500",
              ].join(" ")}
            >
              {room.kind === "direct-call"
                ? "call"
                : `${room.members?.length ?? 0} members`}
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onCreateInvite(room)}
              className={[
                "text-xs",
                currentRoom === room.roomId ? "text-blue-200" : "text-blue-500",
              ].join(" ")}
            >
              invite
            </button>
            {room.kind !== "direct-call" && onLeaveRoom && (
              <button
                onClick={() => onLeaveRoom(room.roomId)}
                className={[
                  "text-xs",
                  currentRoom === room.roomId ? "text-red-200" : "text-red-600",
              ].join(" ")}
            >
                leave
              </button>
            )}
            {room.kind === "direct-call" && onDeleteCall && (
              <button
                onClick={() => onDeleteCall(room.roomId)}
                className="text-xs text-red-600"
              >
                delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
