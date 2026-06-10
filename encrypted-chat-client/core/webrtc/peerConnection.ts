import type { Socket } from "socket.io-client";
import type {
  PeerDataMessage,
  WebRtcSignal,
  WebRtcSignalPayload,
  WebRtcSignalType,
} from "./types";
import { getIceServers } from "./iceServers";

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
  private readonly connection = new RTCPeerConnection({
    iceServers: getIceServers(),
  });
  private channel?: RTCDataChannel;
  private readonly remoteStream = new MediaStream();
  private readonly pendingCandidates: RTCIceCandidateInit[] = [];
  private readonly trackSenders = new Map<string, RTCRtpSender>();
  private makingOffer = false;
  private ignoreOffer = false;

  constructor(private readonly options: PeerConnectionOptions) {
    this.setLocalStream(options.localStream ?? null);

    this.connection.onicecandidate = (event) => {
      if (!event.candidate) return;
      this.sendSignal("ice-candidate", event.candidate.toJSON());
    };

    this.connection.onconnectionstatechange = () => {
      if (["closed", "failed"].includes(this.connection.connectionState)) {
        this.options.onClose();
      }
    };

    this.connection.onnegotiationneeded = () => {
      void this.createOffer();
    };

    this.connection.ondatachannel = (event) => {
      this.attachDataChannel(event.channel);
    };

    this.connection.ontrack = (event) => {
      if (event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          this.addRemoteTrack(track);
        });
      } else {
        this.addRemoteTrack(event.track);
      }

      this.options.onRemoteStream?.(this.options.peerId, this.remoteStream);
    };

    if (options.initiator) {
      this.attachDataChannel(this.connection.createDataChannel("privacify-chat"));
    }
  }

  async createOffer() {
    if (this.makingOffer || this.connection.signalingState !== "stable") return;

    try {
      this.makingOffer = true;
      const offer = await this.connection.createOffer();
      await this.connection.setLocalDescription(offer);
      this.sendSignal("offer", offer);
    } finally {
      this.makingOffer = false;
    }
  }

  async handleSignal(signal: WebRtcSignal) {
    switch (signal.type) {
      case "offer": {
        const offerCollision =
          this.makingOffer || this.connection.signalingState !== "stable";

        this.ignoreOffer = offerCollision && this.options.initiator;
        if (this.ignoreOffer) return;

        if (offerCollision) {
          await this.connection.setLocalDescription({ type: "rollback" });
        }

        await this.connection.setRemoteDescription(signal.payload);
        await this.flushPendingCandidates();
        const answer = await this.connection.createAnswer();
        await this.connection.setLocalDescription(answer);
        this.sendSignal("answer", answer);
        return;
      }
      case "answer":
        await this.connection.setRemoteDescription(signal.payload);
        await this.flushPendingCandidates();
        return;
      case "ice-candidate":
        await this.addIceCandidate(signal.payload);
    }
  }

  setLocalStream(stream: MediaStream | null) {
    if (!stream) return;

    stream.getTracks().forEach((track) => {
      if (this.trackSenders.has(track.id)) return;

      const sender = this.connection.addTrack(track, stream);
      this.trackSenders.set(track.id, sender);
    });
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

  private addRemoteTrack(track: MediaStreamTrack) {
    const exists = this.remoteStream.getTracks().some((item) => item.id === track.id);
    if (exists) return;

    this.remoteStream.addTrack(track);
  }

  private async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.connection.remoteDescription) {
      this.pendingCandidates.push(candidate);
      return;
    }

    try {
      await this.connection.addIceCandidate(candidate);
    } catch (error) {
      if (!this.ignoreOffer) throw error;
    }
  }

  private async flushPendingCandidates() {
    const candidates = this.pendingCandidates.splice(0);

    for (const candidate of candidates) {
      await this.addIceCandidate(candidate);
    }
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
