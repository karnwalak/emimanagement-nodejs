import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token from the password reset email link' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewPassword@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
