import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoanDetail, LoanDetailDocument } from '../../database/schemas/loan-detail.schema';
import { EmiDetail, EmiDetailDocument } from '../../database/schemas/emi-detail.schema';
import { format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(LoanDetail.name) private loanModel: Model<LoanDetailDocument>,
    @InjectModel(EmiDetail.name) private emiModel: Model<EmiDetailDocument>,
  ) {}

  async getStats(userId: string) {
    const userOid = new Types.ObjectId(userId);
    const now = new Date();

    // Get all loan IDs for this user in one query
    const userLoans = await this.loanModel.find({ userId: userOid }, { _id: 1, status: 1, amount: 1 }).lean();
    const loanIds = userLoans.map((l) => l._id);

    const [emiStats, paidByMonth] = await Promise.all([
      // Aggregate EMI stats in a single pipeline
      this.emiModel.aggregate([
        { $match: { loanDetailId: { $in: loanIds } } },
        {
          $group: {
            _id: null,
            totalEmi: { $sum: 1 },
            paidEmi: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
            pendingEmi: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            overdueEmi: {
              $sum: {
                $cond: [{ $and: [{ $eq: ['$status', 'pending'] }, { $lt: ['$dueDate', now] }] }, 1, 0],
              },
            },
            paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
            remainingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          },
        },
      ]),

      // Monthly paid chart
      this.emiModel.aggregate([
        { $match: { loanDetailId: { $in: loanIds }, status: 'paid' } },
        {
          $group: {
            _id: { year: { $year: '$dueDate' }, month: { $month: '$dueDate' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const emi = emiStats[0] || {
      totalEmi: 0, paidEmi: 0, pendingEmi: 0, overdueEmi: 0, paidAmount: 0, remainingAmount: 0,
    };

    // Build monthly chart as { 'Jan 2025': 50000 }
    const monthlyChart: Record<string, number> = {};
    for (const entry of paidByMonth) {
      const date = new Date(entry._id.year, entry._id.month - 1, 1);
      const label = format(date, 'MMM yyyy');
      monthlyChart[label] = entry.total;
    }

    // Loans with any overdue pending EMI
    const overdueLoansIds = await this.emiModel.distinct('loanDetailId', {
      loanDetailId: { $in: loanIds },
      status: 'pending',
      dueDate: { $lt: now },
    });

    return {
      total_loan: userLoans.length,
      total_open_loan: userLoans.filter((l) => l.status === 'open').length,
      total_closed_loan: userLoans.filter((l) => l.status === 'closed').length,
      total_emi: emi.totalEmi,
      paid_emi: emi.paidEmi,
      pending_emi: emi.pendingEmi,
      overdue_emi: emi.overdueEmi,
      total_amount: userLoans.reduce((s, l) => s + (l.amount || 0), 0),
      paid_amount: emi.paidAmount,
      remaining_amount: emi.remainingAmount,
      total_overdue_loan: overdueLoansIds.length,
      monthly_chart: monthlyChart,
    };
  }
}
