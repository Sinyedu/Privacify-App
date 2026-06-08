import { Controller, Get, Param } from '@nestjs/common';
import { InviteService } from './invite.service';

@Controller('invite')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Get(':token')
  async resolve(@Param('token') token: string) {
    const invite = await this.inviteService.resolveToken(token);

    if (!invite) {
      return { valid: false };
    }

    return { valid: true, roomId: invite.roomId, intent: invite.intent };
  }
}
