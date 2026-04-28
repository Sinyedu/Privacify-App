import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from '../messages/message.service';
import { InviteService } from '../invite/invite.service';

type Identity = {
  userId: string;
  username: string;
  type: 'auth' | 'guest';
};

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messageService: MessageService,
    private readonly inviteService: InviteService,
  ) {}

  handleConnection(client: Socket) {
    console.log('[gateway] client connected:', client.id);

    const identity = client.handshake.auth as Identity;

    console.log('[gateway] handshake:', identity);

    client.data.identity = identity?.userId
      ? identity
      : {
          userId: 'anon_' + client.id,
          username: 'anonymous',
          type: 'guest',
        };

    console.log('[gateway] identity:', client.data.identity.username);
  }

  handleDisconnect(client: Socket) {
    console.log('[gateway] disconnected:', client.id);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const identity = client.data.identity as Identity;

    console.log('[gateway] join_room:', data.roomId, identity.username);

    client.join(data.roomId);

    const messages = await this.messageService.findByRoom(data.roomId);

    client.emit('chat_history', messages);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    payload: {
      roomId: string;
      text: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const identity = client.data.identity as Identity;

    console.log('[gateway] send_message:', identity.username);

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
      link: `http://localhost:3000/invite/${token}`,
    });
  }
}
