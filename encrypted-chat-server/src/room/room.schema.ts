import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoomDocument = Room & Document;
export type RoomKind = 'group' | 'direct-call';
export type RoomMember = {
  userId: string;
  username: string;
  type: 'auth';
};

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

  @Prop({ required: true })
  ownerId: string;

  @Prop({
    type: [
      {
        userId: String,
        username: String,
        type: String,
      },
    ],
    default: [],
  })
  members: RoomMember[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
