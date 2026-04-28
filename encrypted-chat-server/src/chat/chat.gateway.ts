import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { MessageService } from '../messages/message.service';
import { InviteService } from '../invite/invite.service';
import { RoomService } from '../room/room.service';

type Identity = {
  userId: string;
  username: string;
  type: 'auth' | 'guest';
};

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

    client.data.identity = identity;

    console.log('[gateway] identity set:', identity.username);
  }

  handleDisconnect(client: Socket) {
    console.log('[gateway] DISCONNECT:', client.id);
  }

  @SubscribeMessage('create_room')
  async createRoom(
    @MessageBody() data: { roomId: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomService.createRoom(data.roomId, data.name);

    const payload = {
      roomId: room.roomId,
      name: room.name,
    };

    this.server.emit('room_created', payload);
  }

  @SubscribeMessage('join_room')
  async joinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const identity = client.data.identity as Identity;

    console.log('[gateway] join_room:', data.roomId, identity.username);

    client.join(data.roomId);

    const messages = await this.messageService.findByRoom(data.roomId);

    client.emit('chat_history', messages);
  }

  @SubscribeMessage('get_rooms')
  async getRooms(@ConnectedSocket() client: Socket) {
    const rooms = await this.roomService.getRooms();

    client.emit(
      'rooms_list',
      rooms.map((r) => ({
        roomId: r.roomId,
        name: r.name,
      })),
    );
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @MessageBody()
    payload: {
      roomId: string;
      text: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const identity = client.data.identity as Identity;

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
      _id: message._id,
      roomId: payload.roomId,
      text: payload.text,
      sender: identity.username,
    });
  }

  @SubscribeMessage('create_invite')
  async createInvite(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const identity = client.data.identity as Identity;

    console.log('[gateway] create_invite:', identity.username);

    const token = await this.inviteService.createInvite(data.roomId);

    client.emit('invite_created', {
      link: `${process.env.CLIENT_URL}/invite/${token}`,
    });
  }
}
