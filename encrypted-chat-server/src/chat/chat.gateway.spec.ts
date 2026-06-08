import { Test, TestingModule } from '@nestjs/testing';
import { InviteService } from '../invite/invite.service';
import { MessageService } from '../messages/message.service';
import { RoomService } from '../room/room.service';
import { ChatGateway } from './chat.gateway';
import { SignalingService } from './signaling.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        SignalingService,
        {
          provide: MessageService,
          useValue: {},
        },
        {
          provide: InviteService,
          useValue: {},
        },
        {
          provide: RoomService,
          useValue: {},
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
