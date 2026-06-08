export type Identity = {
  userId: string;
  username: string;
  type: 'auth' | 'guest';
};

export type PeerInfo = {
  socketId: string;
  identity: Identity;
};

export type SignalType = 'offer' | 'answer' | 'ice-candidate';

export type WebRtcSignalPayload = {
  roomId: string;
  targetId: string;
  type: SignalType;
  payload: unknown;
};
