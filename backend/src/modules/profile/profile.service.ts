import { Injectable, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { LoanDetail } from '../../database/schemas/loan-detail.schema';
import { EmiDetail } from '../../database/schemas/emi-detail.schema';
import { LoanDocument } from '../../database/schemas/loan-document.schema';
import { ContactForm } from '../../database/schemas/contact-form.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { hashPassword, comparePassword } from '../../common/utils/bcrypt.util';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(LoanDetail.name) private loanModel: Model<any>,
    @InjectModel(EmiDetail.name) private emiModel: Model<any>,
    @InjectModel(LoanDocument.name) private docModel: Model<any>,
    @InjectModel(ContactForm.name) private contactModel: Model<any>,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const emailConflict = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
      _id: { $ne: new Types.ObjectId(userId) },
    });

    if (emailConflict) {
      throw new ConflictException('This email is already in use by another account.');
    }

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { name: dto.name, email: dto.email.toLowerCase() },
      { new: true },
    );

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userModel.findById(userId);

    if (!user.password) {
      throw new BadRequestException('This account uses Google sign-in. Password cannot be changed here.');
    }

    const valid = await comparePassword(dto.currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    user.password = await hashPassword(dto.newPassword);
    await user.save();
  }

  async deleteAccount(userId: string): Promise<void> {
    const userOid = new Types.ObjectId(userId);

    // Cascade delete all user data
    const userLoans = await this.loanModel.find({ userId: userOid }, { _id: 1 }).lean();
    const loanIds = userLoans.map((l) => l._id);

    await Promise.all([
      this.emiModel.deleteMany({ loanDetailId: { $in: loanIds } }),
      this.docModel.deleteMany({ loanDetailsId: { $in: loanIds } }),
    ]);

    await this.loanModel.deleteMany({ userId: userOid });
    await this.contactModel.updateMany({ userId: userOid }, { $set: { userId: null } });
    await this.userModel.findByIdAndDelete(userId);
  }
}
