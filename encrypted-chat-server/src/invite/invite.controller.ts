import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InviteService } from './invite.service';
import { RoomService } from '../room/room.service';
import type { RoomMember } from '../room/room.schema';

@Controller('invite')
export class InviteController {
  constructor(
    private readonly inviteService: InviteService,
    private readonly roomService: RoomService,
  ) {}

  @Get(':token')
  async resolve(@Param('token') token: string) {
    const invite = await this.inviteService.resolveToken(token);

    if (!invite) {
      return { valid: false };
    }

    return { valid: true, roomId: invite.roomId, intent: invite.intent };
  }

  @Post(':token/accept')
  async accept(
    @Param('token') token: string,
    @Body() body: { identity?: RoomMember },
  ) {
    const invite = await this.inviteService.resolveToken(token);

    if (!invite || !body.identity?.userId || !body.identity.username) {
      return { valid: false };
    }

    const room = await this.roomService.addMember(invite.roomId, body.identity);

    if (!room) {
      return { valid: false };
    }

    return { valid: true, roomId: invite.roomId, intent: invite.intent };
  }
}
