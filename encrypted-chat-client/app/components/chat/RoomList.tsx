import type { Room } from "./sidebar-types";

type RoomListProps = {
  rooms: Room[];
  currentRoom: string | null;
  onJoinRoom: (room: Room) => void;
  onCreateInvite: (roomId: string) => void;
};

export default function RoomList({
  rooms,
  currentRoom,
  onJoinRoom,
  onCreateInvite,
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
          <span onClick={() => onJoinRoom(room)} className="min-w-0">
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
              onClick={() => onCreateInvite(room.roomId)}
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
  );
}
