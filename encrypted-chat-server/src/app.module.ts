import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatGateway } from './chat/chat.gateway';
import { ChatRoomCommandService } from './chat/chat-room-command.service';
import { SignalingService } from './chat/signaling.service';
import { MessageModule } from './messages/message.module';
import { InvitesModule } from './invite/invite.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRoot(process.env.MONGO_URI as string),

    UsersModule,
    AuthModule,

    MessageModule,
    InvitesModule,
    RoomModule,
  ],
  providers: [ChatGateway, SignalingService, ChatRoomCommandService],
})
export class AppModule {}
