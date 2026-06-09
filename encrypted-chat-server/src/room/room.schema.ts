import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RoomDocument = Room & Document;
export type RoomKind = 'group' | 'direct-call';
export type RoomMember = {
  userId: string;
  username: string;
  type: 'auth';
};

const RoomMemberSchema = new MongooseSchema<RoomMember>(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    type: { type: String, required: true, enum: ['auth'] },
  },
  { _id: false },
);

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
    type: [RoomMemberSchema],
    default: [],
  })
  members: RoomMember[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
