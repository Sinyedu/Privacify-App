import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  Ack,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { MessageService } from '../messages/message.service';
import { InviteService } from '../invite/invite.service';
import { RoomService } from '../room/room.service';
import type { Identity, WebRtcSignalPayload } from './chat.types';
import { SignalingService } from './signaling.service';
import { getCorsOrigin } from '../config/cors';
import {
  ChatRoomCommandService,
  CreateCallResult,
  DeleteCallResult,
  CreateInviteResult,
  CreateRoomResult,
  LeaveGroupResult,
} from './chat-room-command.service';

type SocketAck<T> = (response: T) => void;

@WebSocketGateway({
  cors: {
    origin: getCorsOrigin(),
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
    private readonly roomCommands: ChatRoomCommandService,
  ) {}

  handleConnection(client: Socket) {
    const rawIdentity = client.handshake.auth as Partial<Identity>;

    console.log('[gateway] CONNECT:', client.id);
    console.log('[gateway] auth payload:', rawIdentity);

    if (
      !rawIdentity?.userId ||
      !rawIdentity?.username ||
      rawIdentity.type !== 'auth'
    ) {
      client.emit('auth_required');
      client.disconnect(true);
      return;
    }

    const identity = rawIdentity as Identity;

    this.signalingService.initializeClient(client, identity);

    console.log('[gateway] identity set:', identity.username);
  }

  handleDisconnect(client: Socket) {
    this.signalingService.notifyDisconnect(client);
    console.log('[gateway] DISCONNECT:', client.id);
  }

  @SubscribeMessage('create_room')
  async createRoom(
    @MessageBody() data: { roomId: string; name: string },
    @ConnectedSocket() client: Socket,
    @Ack() ack?: SocketAck<CreateRoomResult>,
  ) {
    const identity = this.signalingService.getIdentity(client);
    if (!identity) {
      const message = 'Missing socket identity. Reconnect and try again.';
      client.emit('room_create_failed', { message });
      ack?.({ ok: false, message });
      return;
    }

    try {
      const result = await this.roomCommands.createGroupRoom(identity, data);

      if (result.ok) {
        client.emit('room_created', result.room);
      } else {
        client.emit('room_create_failed', { message: result.message });
      }

      ack?.(result);
    } catch (error) {
      console.error('[gateway] create_room failed:', error);
      const message = 'Could not create the group. Try again.';
      client.emit('room_create_failed', { message });
      ack?.({ ok: false, message });
    }
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

    if (!room) {
      client.emit('room_join_blocked', {
        roomId: data.roomId,
        reason: 'room_missing',
      });
      return;
    }

    const isMember = await this.roomService.isMember(
      data.roomId,
      identity.userId,
    );

    if (!isMember) {
      client.emit('room_join_blocked', {
        roomId: data.roomId,
        reason: 'not_member',
      });
      return;
    }

    const isRoomFull = await this.signalingService.isRoomFull(
      this.server,
      client,
      data.roomId,
      room.maxParticipants,
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

  @SubscribeMessage('leave_group')
  async leaveGroup(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
    @Ack() ack?: SocketAck<LeaveGroupResult>,
  ) {
    const identity = this.signalingService.getIdentity(client);
    if (!identity) {
      const message = 'Missing socket identity. Reconnect and try again.';
      ack?.({ ok: false, message });
      return;
    }

    const result = await this.roomCommands.leaveGroup(identity, data);

    if (!result.ok) {
      ack?.(result);
      return;
    }

    this.signalingService.leaveRoom(client, data.roomId);
    client.emit('room_left', {
      roomId: result.roomId,
    });

    if (result.deleted) {
      this.server.emit('room_deleted', {
        roomId: result.roomId,
      });
    }

    ack?.(result);
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
    const identity = this.signalingService.getIdentity(client);
    if (!identity) return;

    const rooms = await this.roomService.getRoomsForMember(identity.userId);

    client.emit(
      'rooms_list',
      rooms.map((r) => ({
        roomId: r.roomId,
        name: r.name,
        kind: r.kind ?? 'group',
        members: r.members ?? [],
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

    const isMember = await this.roomService.isMember(
      payload.roomId,
      identity.userId,
    );

    if (!isMember) {
      return;
    }

    console.log('[gateway] send_message:', identity.username, payload.roomId);

    const message = await this.messageService.create({
      roomId: payload.roomId,
      sender: identity.username,
      encrypted: payload.text,
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
    @Ack() ack?: SocketAck<CreateInviteResult>,
  ) {
    const identity = this.signalingService.getIdentity(client);
    if (!identity) {
      const message = 'Missing socket identity. Reconnect and try again.';
      ack?.({ ok: false, message });
      return;
    }

    console.log('[gateway] create_invite:', identity.username);

    const result = await this.roomCommands.createGroupInvite(identity, data);

    if (result.ok) {
      client.emit('invite_created', result.invite);
    }

    ack?.(result);
  }

  @SubscribeMessage('create_call_invite')
  async createCallInvite(
    @MessageBody() data: { label?: string },
    @ConnectedSocket() client: Socket,
    @Ack() ack?: SocketAck<CreateCallResult>,
  ) {
    const identity = this.signalingService.getIdentity(client);
    if (!identity) {
      const message = 'Missing socket identity. Reconnect and try again.';
      client.emit('call_create_failed', { message });
      ack?.({ ok: false, message });
      return;
    }

    try {
      const result = await this.roomCommands.createDirectCall(identity, data);

      if (result.ok) {
        client.emit('room_created', result.room);
        client.emit('invite_created', result.invite);
      }

      ack?.(result);
    } catch (error) {
      console.error('[gateway] create_call_invite failed:', error);
      const message = 'Could not create the call. Try again.';
      client.emit('call_create_failed', { message });
      ack?.({ ok: false, message });
    }
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

    this.server.to(data.roomId).emit('call_ended', {
      roomId: data.roomId,
      endedBy: identity.username,
    });
  }

  @SubscribeMessage('delete_call')
  async deleteCall(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
    @Ack() ack?: SocketAck<DeleteCallResult>,
  ) {
    const identity = this.signalingService.getIdentity(client);
    if (!identity) {
      const message = 'Missing socket identity. Reconnect and try again.';
      ack?.({ ok: false, message });
      return;
    }

    const result = await this.roomCommands.deleteOwnCall(identity, data);

    if (result.ok) {
      this.server.to(result.roomId).emit('call_ended', {
        roomId: result.roomId,
        endedBy: identity.username,
      });
      this.server.emit('room_deleted', {
        roomId: result.roomId,
      });
    }

    ack?.(result);
  }
}
