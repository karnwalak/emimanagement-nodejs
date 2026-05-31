import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { addMonths } from 'date-fns';
import { LoanDetail, LoanDetailDocument } from '../../database/schemas/loan-detail.schema';
import { EmiDetail, EmiDetailDocument } from '../../database/schemas/emi-detail.schema';
import { LoanDocument, LoanDocumentDocument } from '../../database/schemas/loan-document.schema';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { DataTablesQueryDto } from './dto/datatables-query.dto';
import { calculateEmi } from '../../common/utils/emi-calculator.util';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoansService {
  constructor(
    @InjectModel(LoanDetail.name) private loanModel: Model<LoanDetailDocument>,
    @InjectModel(EmiDetail.name) private emiModel: Model<EmiDetailDocument>,
    @InjectModel(LoanDocument.name) private docModel: Model<LoanDocumentDocument>,
  ) { }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  async findAll(
    userId: string,
    query: { sortField?: string; sortDirection?: string; status?: string; page?: number; limit?: number },
  ): Promise<Record<string, unknown>> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query.status) filter.status = query.status;

    const sortField = query.sortField || 'createdAt';
    const sortDirection = query.sortDirection === 'asc' ? 1 : -1;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.loanModel
        .find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.loanModel.countDocuments(filter),
    ]);

    // Attach EMI summary to each loan
    const loanIds = data.map((l) => l._id);
    const emiSummaries = await this.emiModel.aggregate([
      { $match: { loanDetailId: { $in: loanIds } } },
      {
        $group: {
          _id: '$loanDetailId',
          total: { $sum: 1 },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        },
      },
    ]);

    const summaryMap: Record<string, { total: number; paid: number }> = {};
    for (const s of emiSummaries) summaryMap[s._id.toString()] = s;

    const enriched = data.map((loan) => ({
      ...loan,
      emiSummary: summaryMap[loan._id.toString()] || { total: 0, paid: 0 },
    }));

    return {
      data: enriched,
      total,
      page,
      lastPage: Math.ceil(total / limit),
      perPage: limit,
    };
  }

  async findOne(id: string, userId: string): Promise<LoanDetailDocument> {
    const loan = await this.loanModel.findById(id).exec();
    if (!loan) throw new NotFoundException('Loan not found.');
    if (loan.userId.toString() !== userId) throw new ForbiddenException();
    return loan;
  }

  async create(userId: string, dto: CreateLoanDto): Promise<LoanDetailDocument> {
    const calc = calculateEmi({
      amount: dto.amount,
      loanType: dto.loanType,
      interestRate: dto.interestRate,
      tenure: dto.tenure,
      emiAmountFixed: dto.emiAmount,
    });

    const totalEmiCount = calc.emiCount + (calc.remainingAmount > 0 ? 1 : 0);

    const loan = await this.loanModel.create({
      userId: new Types.ObjectId(userId),
      provider: dto.provider,
      amount: dto.amount,
      emiAmount: Math.round(calc.emiAmount),
      processingFee: dto.processingFee,
      loanType: dto.loanType,
      interestRate: dto.interestRate,
      emiCount: totalEmiCount,
      disbursedDate: dto.disbursedDate,
      status: 'open',
    });

    await this.createEmiRecords(loan._id as Types.ObjectId, calc.emiAmount, calc.emiCount, calc.remainingAmount, dto.disbursedDate);
    return loan;
  }

  async update(id: string, userId: string, dto: UpdateLoanDto): Promise<LoanDetailDocument> {
    const loan = await this.findOne(id, userId);

    const amount = dto.amount ?? loan.amount;
    const interestRate = dto.interestRate ?? loan.interestRate;
    const loanType = dto.loanType ?? loan.loanType;
    const disbursedDate = dto.disbursedDate ?? loan.disbursedDate;

    const calc = calculateEmi({
      amount,
      loanType,
      interestRate,
      tenure: dto.tenure,
      emiAmountFixed: dto.emiAmount,
    });

    const totalEmiCount = calc.emiCount + (calc.remainingAmount > 0 ? 1 : 0);

    await loan.updateOne({
      provider: dto.provider ?? loan.provider,
      amount,
      emiAmount: Math.round(calc.emiAmount),
      processingFee: dto.processingFee ?? loan.processingFee,
      loanType,
      interestRate,
      emiCount: totalEmiCount,
      disbursedDate,
    });

    // Rebuild EMI schedule
    await this.emiModel.deleteMany({ loanDetailId: loan._id });
    await this.createEmiRecords(loan._id as Types.ObjectId, calc.emiAmount, calc.emiCount, calc.remainingAmount, disbursedDate);

    return this.loanModel.findById(id).exec();
  }

  async remove(id: string, userId: string): Promise<void> {
    const loan = await this.findOne(id, userId);
    await this.emiModel.deleteMany({ loanDetailId: loan._id });
    await this.docModel.deleteMany({ loanDetailsId: loan._id });
    await loan.deleteOne();
  }

  async forecloseLoan(loanId: string, userId: string): Promise<void> {
    const loan = await this.findOne(loanId, userId);
    await this.emiModel.updateMany(
      { loanDetailId: loan._id, status: 'pending' },
      { $set: { status: 'paid' } },
    );
    await loan.updateOne({ status: 'closed' });
  }

  // ── DataTables API ───────────────────────────────────────────────────────────

  async findForDatatables(userId: string, query: DataTablesQueryDto) {
    const userOid = new Types.ObjectId(userId);
    const searchValue = query['search[value]'] || (query as any).search?.value || '';
    const sortField = query.sort_field || 'createdAt';
    const sortDir = query.sort_direction === 'asc' ? 1 : -1;
    const start = query.start || 0;
    const length = query.length;

    const filter: any = { userId: userOid };
    if (query.status) filter.status = query.status;
    if (searchValue) {
      filter.$or = [
        { provider: { $regex: searchValue, $options: 'i' } },
        { status: { $regex: searchValue, $options: 'i' } },
      ];
    }

    const baseQuery = this.loanModel.find(filter).sort({ [sortField]: sortDir });
    const totalFiltered = await this.loanModel.countDocuments(filter);

    let data;
    if (length) {
      data = await baseQuery.skip(start).limit(length).lean();
    } else {
      data = await baseQuery.lean();
    }

    // Enrich with EMI details
    const loanIds = data.map((l) => l._id);
    const emiDocs = await this.emiModel.find({ loanDetailId: { $in: loanIds } }).lean();
    const emiMap: Record<string, any[]> = {};
    for (const e of emiDocs) {
      const key = e.loanDetailId.toString();
      if (!emiMap[key]) emiMap[key] = [];
      emiMap[key].push(e);
    }

    const enriched = data.map((loan) => ({
      ...loan,
      emiDetail: emiMap[loan._id.toString()] || [],
    }));

    return {
      draw: query.draw ?? 1,
      recordsTotal: totalFiltered,
      recordsFiltered: totalFiltered,
      success: true,
      data: enriched,
    };
  }

  // ── Documents ────────────────────────────────────────────────────────────────

  async getLoanWithDetails(id: string, userId: string) {
    const loan = await this.findOne(id, userId);
    const [emis, documents] = await Promise.all([
      this.emiModel.find({ loanDetailId: loan._id }).sort({ dueDate: 1 }).lean(),
      this.docModel.find({ loanDetailsId: loan._id }).lean(),
    ]);
    return { loan, emis, documents };
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  private async createEmiRecords(
    loanId: Types.ObjectId,
    emiAmount: number,
    emiCount: number,
    remainingAmount: number,
    startDate: Date,
  ) {
    const records = [];
    for (let i = 1; i <= emiCount; i++) {
      records.push({
        loanDetailId: loanId,
        transactionId: uuidv4().slice(0, 10).replace(/-/g, ''),
        amount: Math.round(emiAmount),
        dueDate: addMonths(new Date(startDate), i),
        status: 'pending',
      });
    }

    if (remainingAmount > 0) {
      records.push({
        loanDetailId: loanId,
        transactionId: uuidv4().slice(0, 10).replace(/-/g, ''),
        amount: Math.round(remainingAmount),
        dueDate: addMonths(new Date(startDate), emiCount + 1),
        status: 'pending',
      });
    }

    if (records.length > 0) {
      await this.emiModel.insertMany(records);
    }
  }
}
