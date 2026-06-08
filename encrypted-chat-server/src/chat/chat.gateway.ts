import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { randomUUID } from 'crypto';
import { Server, Socket } from 'socket.io';
import { MessageService } from '../messages/message.service';
import { InviteService } from '../invite/invite.service';
import { RoomService } from '../room/room.service';
import type { Identity, WebRtcSignalPayload } from './chat.types';
import { SignalingService } from './signaling.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messageService: MessageService,
    private readonly inviteService: InviteService,
    private readonly roomService: RoomService,
    private readonly signalingService: SignalingService,
  ) {}

  handleConnection(client: Socket) {
    const rawIdentity = client.handshake.auth as Partial<Identity>;

    console.log('[gateway] CONNECT:', client.id);
    console.log('[gateway] auth payload:', rawIdentity);

    const identity: Identity =
      rawIdentity?.userId && rawIdentity?.username
        ? (rawIdentity as Identity)
        : {
            userId: `anon_${client.id}`,
            username: 'guest',
            type: 'guest',
          };

    this.signalingService.initializeClient(client, identity);

    console.log('[gateway] identity set:', identity.username);
  }

  handleDisconnect(client: Socket) {
    this.signalingService.notifyDisconnect(client);
    console.log('[gateway] DISCONNECT:', client.id);
  }

  @SubscribeMessage('create_room')
  async createRoom(@MessageBody() data: { roomId: string; name: string }) {
    const room = await this.roomService.createRoom({
      roomId: data.roomId,
      name: data.name,
      kind: 'group',
    });

    const payload = {
      roomId: room.roomId,
      name: room.name,
      kind: room.kind,
    };

    this.server.emit('room_created', payload);
  }

  @SubscribeMessage('join_room')
  async joinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const identity = this.signalingService.getIdentity(client);
    if (!identity) return;

    console.log('[gateway] join_room:', data.roomId, identity.username);

    const room = await this.roomService.findByRoomId(data.roomId);
    const isRoomFull = await this.signalingService.isRoomFull(
      this.server,
      client,
      data.roomId,
      room?.maxParticipants,
    );

    if (isRoomFull) {
      client.emit('room_join_blocked', {
        roomId: data.roomId,
        reason: 'room_full',
      });
      return;
    }

    const messages = await this.messageService.findByRoom(data.roomId);
    const peers = await this.signalingService.joinRoom(
      this.server,
      client,
      data.roomId,
    );

    client.emit('chat_history', messages);
    client.emit('room_peers', {
      roomId: data.roomId,
      peers,
    });
  }

  @SubscribeMessage('leave_room')
  leaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.signalingService.leaveRoom(client, data.roomId);
  }

  @SubscribeMessage('webrtc_signal')
  forwardWebRtcSignal(
    @MessageBody()
    data: WebRtcSignalPayload,
    @ConnectedSocket() client: Socket,
  ) {
    this.signalingService.forwardSignal(this.server, client, data);
  }

  @SubscribeMessage('get_rooms')
  async getRooms(@ConnectedSocket() client: Socket) {
    const rooms = await this.roomService.getRooms();

    client.emit(
      'rooms_list',
      rooms.map((r) => ({
        roomId: r.roomId,
        name: r.name,
        kind: r.kind ?? 'group',
      })),
    );
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @MessageBody()
    payload: {
      roomId: string;
      text: string;
      id?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const identity = this.signalingService.getIdentity(client);

    if (!identity) {
      console.log('[gateway] blocked message (no identity)');
      return;
    }

    console.log('[gateway] send_message:', identity.username, payload.roomId);

    const message = await this.messageService.create({
      roomId: payload.roomId,
      sender: identity.username,
      encrypted: payload.text,
      isGuest: identity.type === 'guest',
    });

    this.server.to(payload.roomId).emit('receive_message', {
      id: payload.id ?? String(message._id),
      _id: message._id,
      roomId: payload.roomId,
      text: payload.text,
      sender: identity.username,
    });
  }

  @SubscribeMessage('create_invite')
  async createInvite(
    @MessageBody() data: { roomId: string; intent?: 'group' | 'direct-call' },
    @ConnectedSocket() client: Socket,
  ) {
    const identity = this.signalingService.getIdentity(client);
    if (!identity) return;

    console.log('[gateway] create_invite:', identity.username);

    const intent = data.intent ?? 'group';
    const token = await this.inviteService.createInvite(data.roomId, intent);

    client.emit('invite_created', {
      roomId: data.roomId,
      intent,
      link: `/invite/${token}`,
    });
  }

  @SubscribeMessage('create_call_invite')
  async createCallInvite(
    @MessageBody() data: { label?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const identity = this.signalingService.getIdentity(client);
    if (!identity) return;

    const callId = randomUUID();
    const label = data.label?.trim() || `${identity.username}'s private call`;
    const shortId = callId.slice(0, 8);

    const room = await this.roomService.createRoom({
      roomId: `call-${callId}`,
      name: `${label} #${shortId}`,
      kind: 'direct-call',
      maxParticipants: 2,
    });

    this.server.emit('room_created', {
      roomId: room.roomId,
      name: room.name,
      kind: room.kind,
    });

    const token = await this.inviteService.createInvite(
      room.roomId,
      'direct-call',
    );

    client.emit('invite_created', {
      roomId: room.roomId,
      intent: 'direct-call',
      link: `/invite/${token}`,
    });
  }

  @SubscribeMessage('end_call')
  async endCall(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const identity = this.signalingService.getIdentity(client);
    if (!identity) return;

    const room = await this.roomService.findByRoomId(data.roomId);

    if (!room || room.kind !== 'direct-call') {
      return;
    }

    if (!this.signalingService.isJoined(client, data.roomId)) {
      return;
    }

    await Promise.all([
      this.inviteService.deleteByRoomId(data.roomId),
      this.messageService.deleteByRoom(data.roomId),
      this.roomService.deleteByRoomId(data.roomId),
    ]);

    this.server.to(data.roomId).emit('call_ended', {
      roomId: data.roomId,
      endedBy: identity.username,
    });

    this.server.emit('room_deleted', {
      roomId: data.roomId,
    });
  }
}
