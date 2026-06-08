"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { RoomWebRtcSession } from "./roomSession";
import type { EncryptedPeerMessage, Identity } from "./types";

type UseRoomWebRtcOptions = {
  socket: Socket;
  roomId: string;
  identity: Identity | null;
  onMessage: (message: EncryptedPeerMessage) => void;
};

export function useRoomWebRtc({
  socket,
  roomId,
  identity,
  onMessage,
}: UseRoomWebRtcOptions) {
  const [peerCount, setPeerCount] = useState(0);
  const sessionRef = useRef<RoomWebRtcSession | null>(null);

  useEffect(() => {
    if (!identity || !socket.connected) return;

    const session = new RoomWebRtcSession({
      socket,
      roomId,
      identity,
      onMessage,
      onPeerCountChange: setPeerCount,
    });

    sessionRef.current = session;
    socket.on("room_peers", session.handleRoomPeers);
    socket.on("webrtc_signal", session.handleSignal);
    socket.on("peer_left", session.handlePeerLeft);

    return () => {
      socket.off("room_peers", session.handleRoomPeers);
      socket.off("webrtc_signal", session.handleSignal);
      socket.off("peer_left", session.handlePeerLeft);
      session.close();
      sessionRef.current = null;
    };
  }, [identity, onMessage, roomId, socket]);

  const broadcastMessage = (message: EncryptedPeerMessage) => {
    sessionRef.current?.broadcastMessage(message);
  };

  return {
    peerCount,
    broadcastMessage,
  };
}
