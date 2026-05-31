import { IsString, IsNumber, IsArray, ValidateNested, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EmiUpsertItem {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date;
}

export class UpdateEmiDto {
  @ApiProperty()
  @IsString()
  loanDetailId: string;

  @ApiProperty({ type: [EmiUpsertItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmiUpsertItem)
  emiDetails: EmiUpsertItem[];
}

export class MarkEmiPaidDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: ['pending', 'paid'] })
  @IsString()
  status: 'pending' | 'paid';
}

export class SkipEmiDto {
  @ApiProperty()
  @IsString()
  emiId: string;

  @ApiProperty()
  @IsString()
  loanId: string;
}
