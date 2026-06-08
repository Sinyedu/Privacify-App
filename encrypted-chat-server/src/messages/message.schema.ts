import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  roomId: string;

  @Prop({ required: true })
  sender: string;

  @Prop({ required: true })
  encrypted: string;

  @Prop()
  expiresAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
