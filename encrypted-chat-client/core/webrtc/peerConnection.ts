import type { Socket } from "socket.io-client";
import type {
  PeerDataMessage,
  WebRtcSignal,
  WebRtcSignalPayload,
  WebRtcSignalType,
} from "./types";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type PeerConnectionOptions = {
  socket: Socket;
  roomId: string;
  peerId: string;
  initiator: boolean;
  localStream?: MediaStream | null;
  onDataMessage: (message: PeerDataMessage) => void;
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  onOpen: () => void;
  onClose: () => void;
};

export class PeerConnection {
  private readonly connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  private channel?: RTCDataChannel;
  private readonly remoteStream = new MediaStream();

  constructor(private readonly options: PeerConnectionOptions) {
    options.localStream?.getTracks().forEach((track) => {
      if (options.localStream) {
        this.connection.addTrack(track, options.localStream);
      }
    });

    this.connection.onicecandidate = (event) => {
      if (!event.candidate) return;
      this.sendSignal("ice-candidate", event.candidate.toJSON());
    };

    this.connection.onconnectionstatechange = () => {
      if (["closed", "disconnected", "failed"].includes(this.connection.connectionState)) {
        this.options.onClose();
      }
    };

    this.connection.ondatachannel = (event) => {
      this.attachDataChannel(event.channel);
    };

    this.connection.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        this.remoteStream.addTrack(track);
      });

      this.options.onRemoteStream?.(this.options.peerId, this.remoteStream);
    };

    if (options.initiator) {
      this.attachDataChannel(this.connection.createDataChannel("privacify-chat"));
    }
  }

  async createOffer() {
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
    this.sendSignal("offer", offer);
  }

  async handleSignal(signal: WebRtcSignal) {
    switch (signal.type) {
      case "offer": {
        await this.connection.setRemoteDescription(signal.payload);
        const answer = await this.connection.createAnswer();
        await this.connection.setLocalDescription(answer);
        this.sendSignal("answer", answer);
        return;
      }
      case "answer":
        await this.connection.setRemoteDescription(signal.payload);
        return;
      case "ice-candidate":
        await this.connection.addIceCandidate(signal.payload);
    }
  }

  send(message: PeerDataMessage): boolean {
    if (this.channel?.readyState !== "open") return false;

    this.channel.send(JSON.stringify(message));
    return true;
  }

  close() {
    this.channel?.close();
    this.connection.close();
  }

  private attachDataChannel(channel: RTCDataChannel) {
    this.channel = channel;
    channel.onopen = this.options.onOpen;
    channel.onmessage = (event) => {
      this.options.onDataMessage(JSON.parse(event.data) as PeerDataMessage);
    };
    channel.onclose = this.options.onClose;
  }

  private sendSignal(type: WebRtcSignalType, payload: WebRtcSignalPayload) {
    this.options.socket.emit("webrtc_signal", {
      roomId: this.options.roomId,
      targetId: this.options.peerId,
      type,
      payload,
    });
  }
}
