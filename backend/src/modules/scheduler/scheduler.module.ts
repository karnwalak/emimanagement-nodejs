import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulerService } from './scheduler.service';
import { EmiDetail, EmiDetailSchema } from '../../database/schemas/emi-detail.schema';
import { LoanDetail, LoanDetailSchema } from '../../database/schemas/loan-detail.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmiDetail.name, schema: EmiDetailSchema },
      { name: LoanDetail.name, schema: LoanDetailSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
