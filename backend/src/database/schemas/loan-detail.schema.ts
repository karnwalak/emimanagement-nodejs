import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LoanDetailDocument = HydratedDocument<LoanDetail>;

export type LoanStatus = 'open' | 'closed';
export type LoanType = 'tenure' | 'emi_amount';

@Schema({ timestamps: true, collection: 'loan_details' })
export class LoanDetail {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: null })
  provider: string;

  @Prop({ type: Number, default: 0 })
  amount: number;

  @Prop({ type: Number, default: 0 })
  emiAmount: number;

  @Prop({ type: Number, default: 0 })
  processingFee: number;

  @Prop({ type: Number, default: 0 })
  interestRate: number;

  @Prop({ type: Number, default: 0 })
  emiCount: number;

  @Prop({ enum: ['tenure', 'emi_amount'], default: 'tenure' })
  loanType: LoanType;

  @Prop({ type: Date, default: null })
  disbursedDate: Date;

  @Prop({ enum: ['open', 'closed'], default: 'open' })
  status: LoanStatus;
}

export const LoanDetailSchema = SchemaFactory.createForClass(LoanDetail);

LoanDetailSchema.index({ userId: 1, status: 1 });
LoanDetailSchema.index({ userId: 1, createdAt: -1 });
