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

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name)
    private roomModel: Model<RoomDocument>,
  ) {}

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
      .find({ 'members.userId': userId })
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
      'members.userId': userId,
    });

    return Boolean(room);
  }

  async addMember(roomId: string, member: RoomMember) {
    return this.roomModel.findOneAndUpdate(
      {
        roomId,
        'members.userId': { $ne: member.userId },
      },
      {
        $push: { members: member },
      },
      {
        new: true,
      },
    );
  }
}
