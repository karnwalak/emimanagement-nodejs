import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class DataTablesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  draw?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  start?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsString()
  'search[value]'?: string;

  @IsOptional()
  @IsString()
  sort_field?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sort_direction?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  status?: string;
}
