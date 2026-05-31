import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../../database/schemas/user.schema';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  // ── Register ──────────────────────────────────────────────────────────────

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    const { user, token } = await this.authService.register(dto);
    return {
      token,
      user: { id: user._id, name: user.name, email: user.email, emailVerifiedAt: user.emailVerifiedAt },
    };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@CurrentUser() user: UserDocument, @Body() body: LoginDto) {
    const { token } = await this.authService.login(user, body.turnstileToken);
    return {
      token,
      user: { id: user._id, name: user.name, email: user.email, emailVerifiedAt: user.emailVerifiedAt },
    };
  }

  // ── Current User ──────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  me(@CurrentUser() user: UserDocument) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }

  // ── Email Verification ────────────────────────────────────────────────────

  @Get('verify-email/:token')
  @ApiOperation({ summary: 'Verify email address via token link' })
  async verifyEmail(@Param('token') token: string, @Res() res: Response) {
    await this.authService.verifyEmail(token);
    return res.redirect(`${this.config.get('FRONTEND_URL')}/login?verified=1`);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 6 } })
  @HttpCode(HttpStatus.OK)
  async resendVerification(@CurrentUser() user: UserDocument) {
    await this.authService.resendVerification((user._id as any).toString());
    return { message: 'Verification email sent.' };
  }

  // ── Password Reset ────────────────────────────────────────────────────────

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Password has been reset successfully. Please log in.' };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Redirect to Google OAuth2 login' })
  googleAuth() {
    // Passport redirects automatically
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth2 callback' })
  async googleCallback(@CurrentUser() user: UserDocument, @Res() res: Response) {
    const token = this.authService.signToken(user);
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    return res.redirect(`${frontendUrl}/auth/social-callback?token=${token}`);
  }
}
