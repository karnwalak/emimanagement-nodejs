import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { LoanDocument, LoanDocumentSchema } from '../../database/schemas/loan-document.schema';
import { LoanDetail, LoanDetailSchema } from '../../database/schemas/loan-detail.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoanDocument.name, schema: LoanDocumentSchema },
      { name: LoanDetail.name, schema: LoanDetailSchema },
    ]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
