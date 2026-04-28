import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class IdentityService {
  createGuestIdentity(username: string) {
    return {
      userId: `guest_${randomUUID()}`,
      type: 'guest',
      username,
    };
  }
}
