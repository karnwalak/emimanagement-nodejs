import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactForm, ContactFormSchema } from '../../database/schemas/contact-form.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ContactForm.name, schema: ContactFormSchema }]),
    NotificationsModule,
  ],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
