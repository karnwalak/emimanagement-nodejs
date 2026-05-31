import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('MAIL_HOST'),
      port: Number(config.get('MAIL_PORT', 587)),
      secure: false,
      auth: {
        user: config.get('MAIL_USER'),
        pass: config.get('MAIL_PASS'),
      },
    });
  }

  private compileTemplate(templateName: string, context: Record<string, any>): string {
    const templatePath = path.join(process.cwd(), 'templates', `${templateName}.hbs`);
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(source);
    return template(context);
  }

  private async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.config.get('MAIL_FROM_NAME', 'EMI Management')}" <${this.config.get('MAIL_FROM_ADDRESS')}>`,
        ...options,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}: ${err.message}`);
      throw err;
    }
  }

  async sendEmailVerification(user: any, token: string): Promise<void> {
    const frontendUrl = this.config.get('FRONTEND_URL');
    const verifyUrl = `${frontendUrl}/auth/verify-email/${token}`;

    const html = this.compileTemplate('email-verification', {
      name: user.name,
      verifyUrl,
    });

    await this.sendMail({
      to: user.email,
      subject: 'Verify your EMI Management account',
      html,
    });
  }

  async sendPasswordReset(user: any, token: string): Promise<void> {
    const frontendUrl = this.config.get('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = this.compileTemplate('password-reset', {
      name: user.name,
      resetUrl,
    });

    await this.sendMail({
      to: user.email,
      subject: 'Reset your EMI Management password',
      html,
    });
  }

  async sendEmiReminder(user: any, emi: any, loanProvider: string): Promise<void> {
    const html = this.compileTemplate('emi-reminder', {
      userName: user.name,
      provider: loanProvider,
      amount: emi.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
      dueDate: new Date(emi.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    });

    await this.sendMail({
      to: user.email,
      subject: `EMI Payment Reminder: ${loanProvider}`,
      html,
    });
  }

  async sendContactFormNotification(form: any): Promise<void> {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL');
    if (!adminEmail) return;

    const html = this.compileTemplate('contact-form-received', {
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
      priority: form.priority,
      id: form._id?.toString(),
      submittedAt: new Date(form.createdAt || Date.now()).toLocaleString('en-IN'),
    });

    await this.sendMail({
      to: adminEmail,
      subject: `[${form.priority.toUpperCase()}] New Contact: ${form.subject}`,
      html,
    });
  }
}
