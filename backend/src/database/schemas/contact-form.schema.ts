import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ContactFormDocument = HydratedDocument<ContactForm>;

export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'closed' | 'spam';
export type ContactPriority = 'low' | 'medium' | 'high' | 'urgent';

@Schema({ timestamps: true, collection: 'contact_forms' })
export class ContactForm {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: ['new', 'in_progress', 'resolved', 'closed', 'spam'], default: 'new' })
  status: ContactStatus;

  @Prop({ enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' })
  priority: ContactPriority;

  @Prop({ default: null })
  category: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo: Types.ObjectId;

  @Prop({ default: null })
  ipAddress: string;

  @Prop({ default: null })
  userAgent: string;

  @Prop({ default: null })
  adminResponse: string;

  @Prop({ default: null })
  respondedAt: Date;

  @Prop({ default: null })
  resolvedAt: Date;

  @Prop({ default: null })
  deletedAt: Date;
}

export const ContactFormSchema = SchemaFactory.createForClass(ContactForm);

ContactFormSchema.index({ status: 1 });
ContactFormSchema.index({ priority: 1 });
ContactFormSchema.index({ email: 1 });
ContactFormSchema.index({ createdAt: -1 });
