import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { LoanDetail, LoanDetailSchema } from '../../database/schemas/loan-detail.schema';
import { EmiDetail, EmiDetailSchema } from '../../database/schemas/emi-detail.schema';
import { LoanDocument, LoanDocumentSchema } from '../../database/schemas/loan-document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoanDetail.name, schema: LoanDetailSchema },
      { name: EmiDetail.name, schema: EmiDetailSchema },
      { name: LoanDocument.name, schema: LoanDocumentSchema },
    ]),
  ],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
