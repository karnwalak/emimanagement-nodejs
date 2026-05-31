import { Controller, Get, Patch, Put, Delete, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../../database/schemas/user.schema';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  me(@CurrentUser() user: UserDocument) {
    return { id: user._id, name: user.name, email: user.email, emailVerifiedAt: user.emailVerifiedAt };
  }

  @Patch()
  @ApiOperation({ summary: 'Update name and email' })
  async update(@CurrentUser() user: UserDocument, @Body() dto: UpdateProfileDto) {
    const updated = await this.profileService.updateProfile((user._id as any).toString(), dto);
    return { id: updated._id, name: updated.name, email: updated.email, message: 'Profile updated successfully.' };
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  async changePassword(@CurrentUser() user: UserDocument, @Body() dto: ChangePasswordDto) {
    await this.profileService.changePassword((user._id as any).toString(), dto);
    return { message: 'Password changed successfully.' };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete account and all associated data' })
  async deleteAccount(@CurrentUser() user: UserDocument) {
    await this.profileService.deleteAccount((user._id as any).toString());
    return { message: 'Your account has been deleted.' };
  }
}
