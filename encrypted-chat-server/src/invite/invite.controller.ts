import { Controller, Get, Param } from '@nestjs/common';
import { InviteService } from './invite.service';

@Controller('invite')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Get(':token')
  async resolve(@Param('token') token: string) {
    const roomId = await this.inviteService.resolveToken(token);

    if (!roomId) {
      return { valid: false };
    }

    return { valid: true, roomId };
  }
}
