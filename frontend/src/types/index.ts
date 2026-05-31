export interface User {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
}

export interface LoanDetail {
  _id: string;
  userId: string;
  provider: string;
  amount: number;
  emiAmount: number;
  processingFee: number;
  interestRate: number;
  emiCount: number;
  loanType: 'tenure' | 'emi_amount';
  disbursedDate: string;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  emiSummary?: { total: number; paid: number };
}

export interface EmiDetail {
  _id: string;
  loanDetailId: string;
  transactionId: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface LoanDocument {
  _id: string;
  loanDetailsId: string;
  document: string;
  path: string;
  createdAt: string;
}

export interface DashboardStats {
  total_loan: number;
  total_open_loan: number;
  total_closed_loan: number;
  total_emi: number;
  paid_emi: number;
  pending_emi: number;
  overdue_emi: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  total_overdue_loan: number;
  monthly_chart: Record<string, number>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
  perPage: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
}
