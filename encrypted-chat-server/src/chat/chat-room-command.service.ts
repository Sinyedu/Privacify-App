import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InviteService } from '../invite/invite.service';
import { MessageService } from '../messages/message.service';
import { RoomService } from '../room/room.service';
import type { Identity } from './chat.types';

export type RoomCreatedPayload = {
  roomId: string;
  name: string;
  kind: 'group' | 'direct-call';
  members: {
    userId: string;
    username: string;
    type: 'auth';
  }[];
};

export type InviteCreatedPayload = {
  roomId: string;
  intent: 'group' | 'direct-call';
  link: string;
};

export type CreateRoomResult =
  | {
      ok: true;
      room: RoomCreatedPayload;
    }
  | {
      ok: false;
      message: string;
    };

export type CreateInviteResult =
  | {
      ok: true;
      invite: InviteCreatedPayload;
    }
  | {
      ok: false;
      message: string;
    };

export type CreateCallResult =
  | {
      ok: true;
      room: RoomCreatedPayload;
      invite: InviteCreatedPayload;
    }
  | {
      ok: false;
      message: string;
    };

export type LeaveGroupResult =
  | {
      ok: true;
      roomId: string;
      deleted: boolean;
    }
  | {
      ok: false;
      message: string;
    };

export type DeleteCallResult =
  | {
      ok: true;
      roomId: string;
    }
  | {
      ok: false;
      message: string;
    };

@Injectable()
export class ChatRoomCommandService {
  constructor(
    private readonly inviteService: InviteService,
    private readonly messageService: MessageService,
    private readonly roomService: RoomService,
  ) {}

  async createGroupRoom(
    identity: Identity,
    data: { roomId: string; name: string },
  ): Promise<CreateRoomResult> {
    if (!data.name?.trim() || !data.roomId?.trim()) {
      return { ok: false, message: 'Group name is required.' };
    }

    const shortId = randomUUID().slice(0, 8);
    const room = await this.roomService.createRoom({
      roomId: data.roomId,
      name: `${data.name} #${shortId}`,
      kind: 'group',
      owner: identity,
    });

    return {
      ok: true,
      room: {
        roomId: room.roomId,
        name: room.name,
        kind: room.kind,
        members: room.members ?? [],
      },
    };
  }

  async createGroupInvite(
    identity: Identity,
    data: { roomId: string; intent?: 'group' | 'direct-call' },
  ): Promise<CreateInviteResult> {
    const intent = data.intent ?? 'group';
    const isMember = await this.roomService.isMember(
      data.roomId,
      identity.userId,
    );

    if (!isMember) {
      return { ok: false, message: 'You are not a member of this room.' };
    }

    const token = await this.inviteService.createInvite(data.roomId, intent);

    return {
      ok: true,
      invite: {
        roomId: data.roomId,
        intent,
        link: `/invite/${token}`,
      },
    };
  }

  async createDirectCall(
    identity: Identity,
    data: { label?: string },
  ): Promise<CreateCallResult> {
    const callId = randomUUID();
    const label = data.label?.trim() || `${identity.username}'s private call`;
    const shortId = callId.slice(0, 8);

    const room = await this.roomService.createRoom({
      roomId: `call-${callId}`,
      name: `${label} #${shortId}`,
      kind: 'direct-call',
      maxParticipants: 2,
      owner: identity,
    });

    const token = await this.inviteService.createInvite(
      room.roomId,
      'direct-call',
    );

    const roomPayload: RoomCreatedPayload = {
      roomId: room.roomId,
      name: room.name,
      kind: room.kind,
      members: room.members ?? [],
    };

    return {
      ok: true,
      room: roomPayload,
      invite: {
        roomId: room.roomId,
        intent: 'direct-call',
        link: `/invite/${token}`,
      },
    };
  }

  async leaveGroup(
    identity: Identity,
    data: { roomId: string },
  ): Promise<LeaveGroupResult> {
    if (!data.roomId?.trim()) {
      return { ok: false, message: 'Missing group id.' };
    }

    const result = await this.roomService.removeMember(
      data.roomId,
      identity.userId,
    );

    if (!result.left) {
      return { ok: false, message: 'Could not leave this group.' };
    }

    if (result.deleted) {
      await Promise.all([
        this.inviteService.deleteByRoomId(data.roomId),
        this.messageService.deleteByRoom(data.roomId),
      ]);
    }

    return {
      ok: true,
      roomId: result.roomId,
      deleted: result.deleted,
    };
  }

  async deleteOwnCall(
    identity: Identity,
    data: { roomId: string },
  ): Promise<DeleteCallResult> {
    const room = await this.roomService.findByRoomId(data.roomId);

    if (!room || room.kind !== 'direct-call') {
      return { ok: false, message: 'Call room not found.' };
    }

    if (room.ownerId !== identity.userId) {
      return {
        ok: false,
        message: 'Only the call owner can delete this call.',
      };
    }

    await Promise.all([
      this.inviteService.deleteByRoomId(data.roomId),
      this.messageService.deleteByRoom(data.roomId),
      this.roomService.deleteByRoomId(data.roomId),
    ]);

    return {
      ok: true,
      roomId: data.roomId,
    };
  }
}
