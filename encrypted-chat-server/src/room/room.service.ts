import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './room.schema';
import type { RoomKind } from './room.schema';

type CreateRoomInput = {
  roomId: string;
  name: string;
  kind?: RoomKind;
  maxParticipants?: number;
};

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name)
    private roomModel: Model<RoomDocument>,
  ) {}

  async createRoom(input: CreateRoomInput) {
    const { roomId, name, kind = 'group', maxParticipants } = input;
    const existing = await this.roomModel.findOne({ roomId });

    if (existing) return existing;

    return this.roomModel.create({
      roomId,
      name,
      kind,
      maxParticipants,
    });
  }

  async getRooms() {
    return this.roomModel.find().sort({ createdAt: -1 });
  }

  async findByRoomId(roomId: string) {
    return this.roomModel.findOne({ roomId });
  }

  async deleteByRoomId(roomId: string) {
    return this.roomModel.deleteOne({ roomId });
  }
}
