import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { hashPassword, comparePassword } from '../../common/utils/bcrypt.util';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {}

  // ── Registration ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<{ user: UserDocument; token: string }> {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const hashed = await hashPassword(dto.password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashed,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Send verification email (non-blocking)
    this.notifications
      .sendEmailVerification(user, verificationToken)
      .catch((err) => this.logger.error('Failed to send verification email', err));

    const token = this.signToken(user);
    return { user, token };
  }

  // ── Login ────────────────────────────────────────────────────────────────────

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) return null;

    const valid = await comparePassword(password, user.password);
    return valid ? user : null;
  }

  async login(user: UserDocument, turnstileToken?: string): Promise<{ user: UserDocument; token: string }> {
    // Cloudflare Turnstile verification (skip in dev if secret not set)
    const secret = this.config.get<string>('CLOUDFLARE_TURNSTILE_SECRET_KEY');
    if (secret && turnstileToken) {
      await this.verifyTurnstile(turnstileToken, secret);
    }

    const token = this.signToken(user);
    return { user, token };
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    name: string;
    email: string;
  }): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: profile.email.toLowerCase() });

    if (existing) {
      existing.googleId = profile.googleId;
      existing.name = profile.name;
      // Auto-verify email for Google users
      if (!existing.emailVerifiedAt) {
        existing.emailVerifiedAt = new Date();
      }
      await existing.save();
      return existing;
    }

    return this.userModel.create({
      name: profile.name,
      email: profile.email.toLowerCase(),
      googleId: profile.googleId,
      emailVerifiedAt: new Date(),
    });
  }

  signToken(user: UserDocument): string {
    const payload = {
      sub: (user._id as any).toString(),
      email: user.email,
      name: user.name,
    };
    return this.jwtService.sign(payload);
  }

  // ── Email Verification ──────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification link.');
    }

    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
  }

  async resendVerification(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException();

    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email is already verified.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await this.notifications.sendEmailVerification(user, token);
  }

  // ── Password Reset ──────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (!user) return; // Silent — don't leak whether email exists

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await this.notifications
      .sendPasswordReset(user, token)
      .catch((err) => this.logger.error('Failed to send password reset email', err));
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');

    const user = await this.userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    user.password = await hashPassword(dto.password);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
  }

  // ── Turnstile Verification ──────────────────────────────────────────────────

  private async verifyTurnstile(token: string, secret: string): Promise<void> {
    try {
      const response = await axios.post(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        new URLSearchParams({ secret, response: token }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      if (!response.data?.success) {
        throw new BadRequestException('Human verification failed. Please try again.');
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('Turnstile verification request failed', err);
      throw new BadRequestException('Human verification could not be completed.');
    }
  }
}
