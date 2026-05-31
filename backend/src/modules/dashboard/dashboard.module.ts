import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { LoanDetail, LoanDetailSchema } from '../../database/schemas/loan-detail.schema';
import { EmiDetail, EmiDetailSchema } from '../../database/schemas/emi-detail.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoanDetail.name, schema: LoanDetailSchema },
      { name: EmiDetail.name, schema: EmiDetailSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
