import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InviteDocument = Invite & Document;
export type InviteIntent = 'group' | 'direct-call';

@Schema({ timestamps: true })
export class Invite {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  roomId: string;

  @Prop({ default: 'group' })
  intent: InviteIntent;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);
