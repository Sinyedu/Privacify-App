import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { Invite, InviteDocument } from './invite.schema';

@Injectable()
export class InviteService {
  constructor(
    @InjectModel(Invite.name)
    private inviteModel: Model<InviteDocument>,
  ) {}

  async createInvite(roomId: string) {
    const token = randomBytes(16).toString('hex');

    await this.inviteModel.create({
      token,
      roomId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return token;
  }

  async resolveToken(token: string) {
    const invite = await this.inviteModel.findOne({ token });

    if (!invite) return null;
    if (invite.expiresAt && invite.expiresAt < new Date()) return null;

    return invite.roomId;
  }
}
