export type RoomMember = {
  userId: string;
  username: string;
  type: "auth";
};

export type Room = {
  roomId: string;
  name: string;
  kind?: "group" | "direct-call";
  members?: RoomMember[];
};

export type InviteCreatedPayload = {
  roomId: string;
  intent?: "group" | "direct-call";
  link: string;
};
