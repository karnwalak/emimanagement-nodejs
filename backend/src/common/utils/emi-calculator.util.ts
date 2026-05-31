export interface EmiCalculationInput {
  amount: number;
  loanType: 'tenure' | 'emi_amount';
  interestRate: number;
  tenure?: number;
  emiAmountFixed?: number;
}

export interface EmiCalculationResult {
  emiAmount: number;
  totalAmount: number;
  emiCount: number;
  remainingAmount: number;
}

export function calculateEmi(input: EmiCalculationInput): EmiCalculationResult {
  const { amount, loanType, interestRate, tenure, emiAmountFixed } = input;

  if (loanType === 'tenure') {
    const n = tenure ?? 0;

    if (n <= 0) {
      return { emiAmount: 0, totalAmount: amount, emiCount: 0, remainingAmount: 0 };
    }

    const monthlyRate = interestRate / 12 / 100;

    if (monthlyRate === 0) {
      const emi = amount / n;
      return { emiAmount: emi, totalAmount: amount, emiCount: n, remainingAmount: 0 };
    }

    const factor = Math.pow(1 + monthlyRate, n);
    const denominator = factor - 1;
    const emi = denominator === 0 ? amount / n : (amount * monthlyRate * factor) / denominator;
    const total = emi * n;

    return { emiAmount: emi, totalAmount: total, emiCount: n, remainingAmount: 0 };
  }

  // emi_amount mode
  const fixedEmi = emiAmountFixed ?? 0;
  if (fixedEmi <= 0) {
    return { emiAmount: 0, totalAmount: amount, emiCount: 0, remainingAmount: 0 };
  }

  const emiCount = Math.floor(amount / fixedEmi);
  const remainingAmount = amount - emiCount * fixedEmi;

  return {
    emiAmount: fixedEmi,
    totalAmount: amount,
    emiCount,
    remainingAmount,
  };
}
