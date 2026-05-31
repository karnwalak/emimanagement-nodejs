import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ContactForm, ContactFormDocument } from '../../database/schemas/contact-form.schema';
import { SubmitContactDto } from './dto/submit-contact.dto';
import { detectContactPriority } from '../../common/utils/priority-detector.util';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectModel(ContactForm.name) private contactModel: Model<ContactFormDocument>,
    private notifications: NotificationsService,
  ) {}

  async submit(
    dto: SubmitContactDto,
    meta: { ipAddress: string; userAgent: string; userId?: string },
  ): Promise<ContactFormDocument> {
    const priority = detectContactPriority(dto.subject, dto.message);

    const form = await this.contactModel.create({
      name: dto.name,
      email: dto.email,
      subject: dto.subject,
      message: dto.message,
      priority,
      status: 'new',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      userId: meta.userId ? new Types.ObjectId(meta.userId) : null,
    });

    this.notifications
      .sendContactFormNotification(form)
      .catch((err) => this.logger.error('Failed to send contact form email', err));

    return form;
  }
}
