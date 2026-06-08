import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Identity, PeerInfo, WebRtcSignalPayload } from './chat.types';

@Injectable()
export class SignalingService {
  private readonly identities = new Map<string, Identity>();
  private readonly roomsBySocket = new Map<string, Set<string>>();

  initializeClient(client: Socket, identity: Identity) {
    this.identities.set(client.id, identity);
    this.roomsBySocket.set(client.id, new Set<string>());
  }

  getIdentity(client: Socket): Identity | undefined {
    return this.identities.get(client.id);
  }

  notifyDisconnect(client: Socket) {
    this.roomsBySocket.get(client.id)?.forEach((roomId) => {
      this.notifyPeerLeft(client, roomId);
    });

    this.identities.delete(client.id);
    this.roomsBySocket.delete(client.id);
  }

  async joinRoom(
    server: Server,
    client: Socket,
    roomId: string,
  ): Promise<PeerInfo[]> {
    const rooms = this.getJoinedRooms(client);
    const alreadyJoined = rooms.has(roomId);

    void client.join(roomId);
    rooms.add(roomId);

    const peers = await this.getRoomPeers(server, roomId, client);
    const identity = this.getIdentity(client);

    if (!alreadyJoined && identity) {
      client.to(roomId).emit('peer_joined', {
        roomId,
        socketId: client.id,
        identity,
      });
    }

    return peers;
  }

  async isRoomFull(
    server: Server,
    client: Socket,
    roomId: string,
    maxParticipants?: number,
  ): Promise<boolean> {
    if (!maxParticipants) return false;

    const sockets = await server.in(roomId).fetchSockets();
    const alreadyJoined = sockets.some((socket) => socket.id === client.id);

    return !alreadyJoined && sockets.length >= maxParticipants;
  }

  leaveRoom(client: Socket, roomId: string) {
    void client.leave(roomId);
    this.roomsBySocket.get(client.id)?.delete(roomId);
    this.notifyPeerLeft(client, roomId);
  }

  isJoined(client: Socket, roomId: string): boolean {
    return Boolean(this.roomsBySocket.get(client.id)?.has(roomId));
  }

  forwardSignal(server: Server, client: Socket, data: WebRtcSignalPayload) {
    const identity = this.getIdentity(client);
    const rooms = this.roomsBySocket.get(client.id);

    if (!identity || !rooms?.has(data.roomId)) return;

    server.to(data.targetId).emit('webrtc_signal', {
      roomId: data.roomId,
      sourceId: client.id,
      identity,
      type: data.type,
      payload: data.payload,
    });
  }

  private getJoinedRooms(client: Socket): Set<string> {
    const rooms = this.roomsBySocket.get(client.id) ?? new Set<string>();
    this.roomsBySocket.set(client.id, rooms);

    return rooms;
  }

  private async getRoomPeers(
    server: Server,
    roomId: string,
    requestingClient: Socket,
  ): Promise<PeerInfo[]> {
    const sockets = await server.in(roomId).fetchSockets();

    return sockets
      .filter((socket) => socket.id !== requestingClient.id)
      .map((socket) => ({
        socketId: socket.id,
        identity: this.identities.get(socket.id),
      }))
      .filter((peer): peer is PeerInfo => Boolean(peer.identity));
  }

  private notifyPeerLeft(client: Socket, roomId: string) {
    client.to(roomId).emit('peer_left', {
      roomId,
      socketId: client.id,
    });
  }
}
