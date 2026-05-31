import { IsEmail, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitContactDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Issue with EMI payment' })
  @IsString()
  @MaxLength(255)
  subject: string;

  @ApiProperty({ example: 'I am facing an issue with...' })
  @IsString()
  message: string;
}
