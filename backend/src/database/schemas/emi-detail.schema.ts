import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EmiDetailDocument = HydratedDocument<EmiDetail>;

export type EmiStatus = 'pending' | 'paid';

@Schema({ timestamps: true, collection: 'emi_details' })
export class EmiDetail {
  @Prop({ type: Types.ObjectId, ref: 'LoanDetail', required: true, index: true })
  loanDetailId: Types.ObjectId;

  @Prop({ required: true })
  transactionId: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Date, required: true })
  dueDate: Date;

  @Prop({ enum: ['pending', 'paid'], default: 'pending' })
  status: EmiStatus;
}

export const EmiDetailSchema = SchemaFactory.createForClass(EmiDetail);

EmiDetailSchema.index({ loanDetailId: 1, status: 1 });
EmiDetailSchema.index({ loanDetailId: 1, dueDate: 1 });
EmiDetailSchema.index({ dueDate: 1, status: 1 });
