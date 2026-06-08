import { Controller, Post, Body } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  create(
    @Body()
    body: {
      roomId: string;
      name: string;
      owner: {
        userId: string;
        username: string;
        type: 'auth' | 'guest';
      };
    },
  ) {
    return this.roomService.createRoom({
      roomId: body.roomId,
      name: body.name,
      kind: 'group',
      owner: body.owner,
    });
  }
}
