export type Room = {
  roomId: string;
  name: string;
  kind?: "group" | "direct-call";
};

export type InviteCreatedPayload = {
  roomId: string;
  intent?: "group" | "direct-call";
  link: string;
};
