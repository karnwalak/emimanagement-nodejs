import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { LoanDetail, LoanDetailSchema } from '../../database/schemas/loan-detail.schema';
import { EmiDetail, EmiDetailSchema } from '../../database/schemas/emi-detail.schema';
import { LoanDocument, LoanDocumentSchema } from '../../database/schemas/loan-document.schema';
import { ContactForm, ContactFormSchema } from '../../database/schemas/contact-form.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: LoanDetail.name, schema: LoanDetailSchema },
      { name: EmiDetail.name, schema: EmiDetailSchema },
      { name: LoanDocument.name, schema: LoanDocumentSchema },
      { name: ContactForm.name, schema: ContactFormSchema },
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
