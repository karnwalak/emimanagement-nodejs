import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { LoanDocument, LoanDocumentDocument } from '../../database/schemas/loan-document.schema';
import { LoanDetail, LoanDetailDocument } from '../../database/schemas/loan-detail.schema';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(LoanDocument.name) private docModel: Model<LoanDocumentDocument>,
    @InjectModel(LoanDetail.name) private loanModel: Model<LoanDetailDocument>,
  ) {}

  async uploadDocuments(
    loanId: string,
    userId: string,
    files: Array<{ fieldname: string; originalname: string; filename: string; path: string }>,
    names: string[],
  ) {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found.');
    if (loan.userId.toString() !== userId) throw new ForbiddenException();

    const docs = files.map((file, i) => ({
      loanDetailsId: new Types.ObjectId(loanId),
      document: names[i] || file.originalname,
      path: `loan_documents/${file.filename}`,
    }));

    const created = await this.docModel.insertMany(docs);
    return created;
  }

  async deleteDocument(docId: string, userId: string): Promise<void> {
    const doc = await this.docModel.findById(docId).populate<{ loanDetailsId: LoanDetailDocument }>('loanDetailsId');
    if (!doc) throw new NotFoundException('Document not found.');

    const loan = doc.loanDetailsId as any;
    if (!loan || loan.userId?.toString() !== userId) throw new ForbiddenException();

    // Delete physical file
    const fullPath = path.join(process.cwd(), '..', 'uploads', doc.path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await doc.deleteOne();
  }
}
