import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InviteDocument = Invite & Document;

@Schema({ timestamps: true })
export class Invite {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  roomId: string;

  @Prop()
  expiresAt?: Date;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);
