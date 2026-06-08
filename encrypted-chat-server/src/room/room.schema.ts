import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoomDocument = Room & Document;
export type RoomKind = 'group' | 'direct-call';

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true, unique: true })
  roomId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'group' })
  kind: RoomKind;

  @Prop()
  maxParticipants?: number;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
