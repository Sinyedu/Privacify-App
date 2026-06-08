import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  async create(data: {
    roomId: string;
    sender: string;
    encrypted: string;
    isGuest: boolean;
  }) {
    const expiresAt = data.isGuest
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : undefined;

    return this.messageModel.create({
      ...data,
      expiresAt,
    });
  }

  async findByRoom(roomId: string) {
    return this.messageModel.find({ roomId }).sort({ createdAt: 1 }).limit(100);
  }

  async deleteByRoom(roomId: string) {
    return this.messageModel.deleteMany({ roomId });
  }
}
