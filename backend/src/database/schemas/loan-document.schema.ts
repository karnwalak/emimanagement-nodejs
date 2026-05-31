import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LoanDocumentDocument = HydratedDocument<LoanDocument>;

@Schema({ timestamps: true, collection: 'loan_documents' })
export class LoanDocument {
  @Prop({ type: Types.ObjectId, ref: 'LoanDetail', required: true, index: true })
  loanDetailsId: Types.ObjectId;

  @Prop({ required: true })
  document: string;

  @Prop({ required: true })
  path: string;
}

export const LoanDocumentSchema = SchemaFactory.createForClass(LoanDocument);
