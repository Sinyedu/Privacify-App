import { Controller, Post, Body } from '@nestjs/common';
import { IdentityService } from './identity.service';

@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('guest')
  createGuest(@Body() body: { username: string }) {
    return this.identityService.createGuestIdentity(body.username);
  }
}
