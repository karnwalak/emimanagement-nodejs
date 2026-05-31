import { IsString, IsNumber, IsDate, IsEnum, IsOptional, Min, Max, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDto {
  @ApiProperty({ example: 'HDFC Bank' })
  @IsString()
  provider: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  processingFee: number;

  @ApiProperty({ example: 10.5, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @ApiProperty({ enum: ['tenure', 'emi_amount'] })
  @IsEnum(['tenure', 'emi_amount'])
  loanType: 'tenure' | 'emi_amount';

  @ApiProperty({ required: false, example: 24, description: 'Required when loanType is tenure' })
  @ValidateIf((o) => o.loanType === 'tenure')
  @IsNumber()
  @Min(1)
  tenure?: number;

  @ApiProperty({ required: false, example: 25000, description: 'Required when loanType is emi_amount' })
  @ValidateIf((o) => o.loanType === 'emi_amount')
  @IsNumber()
  @Min(1)
  emiAmount?: number;

  @ApiProperty({ example: '2024-01-15' })
  @Type(() => Date)
  @IsDate()
  disbursedDate: Date;
}
