import type { Socket } from "socket.io-client";
import {
  exportRoomKey,
  importRoomKey,
  onRoomKeyImported,
} from "@/core/crypto/encryption";
import { PeerConnection } from "./peerConnection";
import type {
  EncryptedPeerMessage,
  Identity,
  PeerDataMessage,
  PeerInfo,
  WebRtcSignal,
} from "./types";

type RoomSessionOptions = {
  socket: Socket;
  roomId: string;
  identity: Identity;
  onMessage: (message: EncryptedPeerMessage) => void;
  onPeerCountChange: (count: number) => void;
};

export class RoomWebRtcSession {
  private readonly peers = new Map<string, PeerConnection>();
  private readonly stopKeyListener: () => void;

  constructor(private readonly options: RoomSessionOptions) {
    this.stopKeyListener = onRoomKeyImported((roomId) => {
      if (roomId === this.options.roomId) void this.shareRoomKey();
    });
  }

  handleRoomPeers = ({ roomId, peers }: { roomId: string; peers: PeerInfo[] }) => {
    if (roomId !== this.options.roomId) return;

    peers.forEach((peer) => {
      void this.connectToPeer(peer.socketId);
    });
  };

  handleSignal = (signal: WebRtcSignal) => {
    if (signal.roomId !== this.options.roomId) return;

    const peer = this.ensurePeer(signal.sourceId, signal.type !== "offer");
    void peer.handleSignal(signal).then(() => this.shareRoomKey());
  };

  handlePeerLeft = ({ roomId, socketId }: { roomId: string; socketId: string }) => {
    if (roomId !== this.options.roomId) return;
    this.removePeer(socketId);
  };

  broadcastMessage(message: EncryptedPeerMessage) {
    this.peers.forEach((peer) => {
      peer.send({
        type: "encrypted_message",
        ...message,
      });
    });
  }

  close() {
    this.peers.forEach((peer) => peer.close());
    this.peers.clear();
    this.stopKeyListener();
    this.emitPeerCount();
  }

  private async connectToPeer(peerId: string) {
    const peer = this.ensurePeer(peerId, true);
    await peer.createOffer();
  }

  private ensurePeer(peerId: string, initiator: boolean): PeerConnection {
    const existing = this.peers.get(peerId);
    if (existing) return existing;

    const peer = new PeerConnection({
      socket: this.options.socket,
      roomId: this.options.roomId,
      peerId,
      initiator,
      onDataMessage: (message) => void this.handleDataMessage(message),
      onOpen: () => void this.shareRoomKey(),
      onClose: () => this.removePeer(peerId),
    });

    this.peers.set(peerId, peer);
    this.emitPeerCount();
    return peer;
  }

  private async handleDataMessage(message: PeerDataMessage) {
    if (message.roomId !== this.options.roomId) return;

    if (message.type === "room_key") {
      await importRoomKey(message.roomId, message.key);
      return;
    }

    this.options.onMessage(message);
  }

  private async shareRoomKey() {
    const key = await exportRoomKey(this.options.roomId);
    if (!key) return;

    this.peers.forEach((peer) => {
      peer.send({
        type: "room_key",
        roomId: this.options.roomId,
        key,
      });
    });
  }

  private removePeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    this.peers.delete(peerId);
    peer.close();
    this.emitPeerCount();
  }

  private emitPeerCount() {
    this.options.onPeerCountChange(this.peers.size);
  }
}
