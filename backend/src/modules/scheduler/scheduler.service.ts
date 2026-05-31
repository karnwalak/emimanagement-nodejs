import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { addDays } from 'date-fns';
import { EmiDetail, EmiDetailDocument } from '../../database/schemas/emi-detail.schema';
import { LoanDetail, LoanDetailDocument } from '../../database/schemas/loan-detail.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectModel(EmiDetail.name) private emiModel: Model<EmiDetailDocument>,
    @InjectModel(LoanDetail.name) private loanModel: Model<LoanDetailDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notifications: NotificationsService,
  ) {}

  // Runs every day at 9 AM — sends reminders for EMIs due in the next 3 days
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendEmiReminders() {
    this.logger.log('Running EMI reminder job...');

    const now = new Date();
    const threeDaysLater = addDays(now, 3);

    const upcomingEmis = await this.emiModel
      .find({
        status: 'pending',
        dueDate: { $gte: now, $lte: threeDaysLater },
      })
      .populate<{ loanDetailId: LoanDetailDocument & { userId: Types.ObjectId } }>('loanDetailId')
      .lean();

    let sent = 0;
    for (const emi of upcomingEmis) {
      const loan = emi.loanDetailId as any;
      if (!loan?.userId) continue;

      const user = await this.userModel.findById(loan.userId).lean();
      if (!user) continue;

      try {
        await this.notifications.sendEmiReminder(user, emi, loan.provider || 'Unknown');
        sent++;
      } catch (err) {
        this.logger.error(`Failed to send reminder for EMI ${emi._id}: ${err.message}`);
      }
    }

    this.logger.log(`EMI reminder job complete. Sent ${sent} reminders.`);
  }
}
