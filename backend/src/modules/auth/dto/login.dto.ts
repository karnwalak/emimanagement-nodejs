import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  password: string;

  @ApiProperty({ required: false, description: 'Cloudflare Turnstile CAPTCHA token' })
  @IsString()
  @IsOptional()
  turnstileToken?: string;
}
