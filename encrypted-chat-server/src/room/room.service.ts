import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './room.schema';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name)
    private roomModel: Model<RoomDocument>,
  ) {}

  async createRoom(roomId: string, name: string) {
    const existing = await this.roomModel.findOne({ roomId });

    if (existing) return existing;

    return this.roomModel.create({
      roomId,
      name,
    });
  }

  async getRooms() {
    return this.roomModel.find().sort({ createdAt: -1 });
  }
}
