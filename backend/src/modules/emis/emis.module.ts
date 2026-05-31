import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmisController } from './emis.controller';
import { EmisService } from './emis.service';
import { EmiDetail, EmiDetailSchema } from '../../database/schemas/emi-detail.schema';
import { LoanDetail, LoanDetailSchema } from '../../database/schemas/loan-detail.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmiDetail.name, schema: EmiDetailSchema },
      { name: LoanDetail.name, schema: LoanDetailSchema },
    ]),
  ],
  controllers: [EmisController],
  providers: [EmisService],
})
export class EmisModule {}
