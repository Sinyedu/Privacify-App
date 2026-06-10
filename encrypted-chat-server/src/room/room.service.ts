import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './room.schema';
import type { RoomKind, RoomMember } from './room.schema';

type CreateRoomInput = {
  roomId: string;
  name: string;
  kind?: RoomKind;
  maxParticipants?: number;
  owner: RoomMember;
};

type LeaveMemberResult =
  | {
      left: true;
      deleted: boolean;
      roomId: string;
    }
  | {
      left: false;
      deleted: false;
      roomId: string;
    };

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name)
    private roomModel: Model<RoomDocument>,
  ) {}

  private membershipFilter(userId: string) {
    return {
      $or: [
        { 'members.userId': userId },
        { ownerId: userId },
        { $expr: { $in: [userId, { $ifNull: ['$members', []] }] } },
      ],
    };
  }

  async createRoom(input: CreateRoomInput) {
    const { roomId, name, kind = 'group', maxParticipants, owner } = input;
    const existing = await this.roomModel.findOne({ roomId });

    if (existing) return existing;

    return this.roomModel.create({
      roomId,
      name,
      kind,
      maxParticipants,
      ownerId: owner.userId,
      members: [owner],
    });
  }

  async getRoomsForMember(userId: string) {
    return this.roomModel
      .find(this.membershipFilter(userId))
      .sort({ createdAt: -1 });
  }

  async findByRoomId(roomId: string) {
    return this.roomModel.findOne({ roomId });
  }

  async deleteByRoomId(roomId: string) {
    return this.roomModel.deleteOne({ roomId });
  }

  async isMember(roomId: string, userId: string) {
    const room = await this.roomModel.exists({
      roomId,
      ...this.membershipFilter(userId),
    });

    return Boolean(room);
  }

  async addMember(roomId: string, member: RoomMember) {
    const isMember = await this.isMember(roomId, member.userId);

    if (isMember) {
      return this.findByRoomId(roomId);
    }

    return this.roomModel.findOneAndUpdate(
      { roomId },
      { $push: { members: member } },
      { new: true },
    );
  }

  async removeMember(
    roomId: string,
    userId: string,
  ): Promise<LeaveMemberResult> {
    const room = await this.findByRoomId(roomId);

    if (!room || room.kind === 'direct-call') {
      return { left: false, deleted: false, roomId };
    }

    const members = (room.members ?? []).filter(
      (member) => member.userId !== userId,
    );
    const wasMember =
      room.ownerId === userId || members.length !== (room.members ?? []).length;

    if (!wasMember) {
      return { left: false, deleted: false, roomId };
    }

    if (members.length === 0) {
      await this.deleteByRoomId(roomId);
      return { left: true, deleted: true, roomId };
    }

    const ownerId = room.ownerId === userId ? members[0].userId : room.ownerId;

    await this.roomModel.updateOne(
      { roomId },
      {
        $set: {
          ownerId,
          members,
        },
      },
    );

    return { left: true, deleted: false, roomId };
  }
}
