export type Identity = {
  userId: string;
  username: string;
  type: "auth" | "guest";
};

export type PeerInfo = {
  socketId: string;
  identity: Identity;
};

type SignalBase = {
  roomId: string;
  sourceId: string;
  identity: Identity;
};

export type WebRtcSignal =
  | (SignalBase & {
      type: "offer" | "answer";
      payload: RTCSessionDescriptionInit;
    })
  | (SignalBase & {
      type: "ice-candidate";
      payload: RTCIceCandidateInit;
    });

export type WebRtcSignalPayload = WebRtcSignal["payload"];

export type WebRtcSignalType = WebRtcSignal["type"];

export type EncryptedPeerMessage = {
  id: string;
  roomId: string;
  encrypted: string;
  sender: string;
};

export type PeerDataMessage =
  | {
      type: "room_key";
      roomId: string;
      key: string;
    }
  | ({
      type: "encrypted_message";
    } & EncryptedPeerMessage);
