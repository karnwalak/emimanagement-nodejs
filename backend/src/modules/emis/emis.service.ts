import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { addMonths } from 'date-fns';
import { EmiDetail, EmiDetailDocument } from '../../database/schemas/emi-detail.schema';
import { LoanDetail, LoanDetailDocument } from '../../database/schemas/loan-detail.schema';
import { UpdateEmiDto, MarkEmiPaidDto, SkipEmiDto } from './dto/update-emi.dto';

@Injectable()
export class EmisService {
  constructor(
    @InjectModel(EmiDetail.name) private emiModel: Model<EmiDetailDocument>,
    @InjectModel(LoanDetail.name) private loanModel: Model<LoanDetailDocument>,
  ) {}

  async markEmiStatus(dto: MarkEmiPaidDto): Promise<void> {
    const emi = await this.emiModel.findById(dto.id);
    if (!emi) throw new NotFoundException('EMI not found.');

    emi.status = dto.status;
    await emi.save();

    // Auto-close loan when all EMIs are paid
    if (dto.status === 'paid') {
      const pendingCount = await this.emiModel.countDocuments({
        loanDetailId: emi.loanDetailId,
        status: 'pending',
      });

      if (pendingCount === 0) {
        await this.loanModel.findByIdAndUpdate(emi.loanDetailId, { status: 'closed' });
      }
    }
  }

  async bulkUpdateEmis(dto: UpdateEmiDto) {
    const updates = dto.emiDetails.map((item) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(item.id) },
        update: {
          $set: {
            ...(item.amount !== undefined && { amount: item.amount }),
            ...(item.dueDate !== undefined && { dueDate: item.dueDate }),
          },
        },
      },
    }));

    await this.emiModel.bulkWrite(updates);

    const updatedEmis = await this.emiModel
      .find({ loanDetailId: new Types.ObjectId(dto.loanDetailId) })
      .select('_id loanDetailId amount dueDate status')
      .sort({ dueDate: 1 })
      .lean();

    return { status: true, message: 'EMI details are updated!', updatedEmi: updatedEmis };
  }

  async skipEmi(dto: SkipEmiDto) {
    // Get all EMIs from the given emi_id onwards for this loan, sorted by dueDate
    const emiOid = new Types.ObjectId(dto.emiId);
    const loanOid = new Types.ObjectId(dto.loanId);

    const targetEmi = await this.emiModel.findById(emiOid);
    if (!targetEmi) throw new NotFoundException('EMI not found.');

    // All EMIs due on or after the target EMI's due date for this loan
    const emisToShift = await this.emiModel.find({
      loanDetailId: loanOid,
      dueDate: { $gte: targetEmi.dueDate },
    });

    const bulkOps = emisToShift.map((emi) => ({
      updateOne: {
        filter: { _id: emi._id },
        update: { $set: { dueDate: addMonths(new Date(emi.dueDate), 1) } },
      },
    }));

    if (bulkOps.length > 0) {
      await this.emiModel.bulkWrite(bulkOps);
    }

    return { status: true, message: 'EMI details are updated!' };
  }
}
