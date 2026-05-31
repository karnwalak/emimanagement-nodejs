import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ default: null })
  password: string;

  @Prop({ default: null })
  googleId: string;

  @Prop({ default: null })
  emailVerifiedAt: Date;

  @Prop({ default: null })
  passwordResetToken: string;

  @Prop({ default: null })
  passwordResetExpires: Date;

  @Prop({ default: null })
  emailVerificationToken: string;

  @Prop({ default: null })
  emailVerificationExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 }, { sparse: true });
