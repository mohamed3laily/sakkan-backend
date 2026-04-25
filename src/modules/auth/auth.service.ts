import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { AuthRepo } from './auth.repo';
import { PhoneUtils } from './utils/phone.utils';

@Injectable()
export class AuthService {
  private static readonly BCRYPT_SALT_ROUNDS = 10;

  constructor(
    private authRepo: AuthRepo,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, phone, password, type } = registerDto;

    const normalizedPhone = PhoneUtils.normalizePhone(phone);
    const existingUser = await this.authRepo.getUserByPhone(normalizedPhone);

    if (existingUser) {
      throw new ConflictException('PHONE_EXISTS');
    }

    const hashedPassword = await this.hashPassword(password);
    const verifyPhoneToken = this.generateVerifyPhoneToken();
    const verifyPhoneTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const [newUser] = await this.authRepo.insertUser(
      {
        firstName,
        lastName,
        phone: normalizedPhone,
        password: hashedPassword,
        type,
      },
      verifyPhoneToken,
      verifyPhoneTokenExpiry,
    );
    const token = this.generateToken(newUser.id, newUser.phone);

    return {
      message: 'REGISTER_OTP_SENT',
      accessToken: token,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        type: newUser.type,
        phoneVerified: !!newUser.verifiedPhoneAt,
      },
    };
  }

  async verifyPhone(phone: string, token: string) {
    const normalizedPhone = PhoneUtils.normalizePhone(phone);

    const user = await this.authRepo.getUserByPhone(normalizedPhone);

    if (!user || !user.verifyPhoneToken || !user.verifyPhoneTokenExpiry) {
      throw new BadRequestException('INVALID_VERIFICATION_REQUEST');
    }

    if (new Date() > user.verifyPhoneTokenExpiry) {
      throw new BadRequestException('VERIFICATION_TOKEN_EXPIRED');
    }

    // TODO: Use crypted tokens and compare using a timing-safe method
    const valid = user.verifyPhoneToken === token;

    if (!valid) {
      throw new BadRequestException('INVALID_VERIFICATION_TOKEN');
    }

    await this.authRepo.updateUser(user.id, {
      verifiedPhoneAt: new Date(),
      verifyPhoneToken: null,
      verifyPhoneTokenExpiry: null,
    });

    return { message: 'PHONE_VERIFIED' };
  }

  async resendVerifyPhone(phone: string) {
    const normalizedPhone = PhoneUtils.normalizePhone(phone);

    const user = await this.authRepo.getUserByPhone(normalizedPhone);
    if (!user) {
      throw new BadRequestException('INVALID_VERIFICATION_REQUEST');
    }

    const verifyPhoneToken = this.generateVerifyPhoneToken();
    const verifyPhoneTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.authRepo.updateUser(user.id, {
      verifyPhoneToken,
      verifyPhoneTokenExpiry,
    });

    return { message: 'VERIFY_OTP_SENT' };
  }

  async login(loginDto: LoginDto) {
    const { phone, password } = loginDto;

    let normalizedPhone: string;
    try {
      normalizedPhone = PhoneUtils.normalizePhone(phone);
    } catch {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const user = await this.authRepo.getUserByPhone(normalizedPhone);

    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const token = this.generateToken(user.id, user.phone);

    return {
      accessToken: token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        phoneVerified: !!user.verifiedPhoneAt,
      },
    };
  }

  async requestPasswordReset(requestResetDto: RequestResetDto) {
    const { phone } = requestResetDto;
    let normalizedPhone: string;
    try {
      normalizedPhone = PhoneUtils.normalizePhone(phone);
    } catch {
      throw new BadRequestException('PHONE_WRONG');
    }

    const user = await this.authRepo.getUserByPhone(normalizedPhone);

    if (!user) {
      throw new NotFoundException('PHONE_NOT_FOUND');
    }

    const resetToken = this.generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.authRepo.updateUser(user.id, {
      resetToken,
      resetTokenExpiry,
    });

    // TODO: Send reset token via SMS provider

    return { message: 'RESET_SENT' };
  }

  async resendResetOtp(requestResetDto: RequestResetDto) {
    const { phone } = requestResetDto;
    let normalizedPhone: string;
    try {
      normalizedPhone = PhoneUtils.normalizePhone(phone);
    } catch {
      throw new BadRequestException('PHONE_WRONG');
    }

    const user = await this.authRepo.getUserByPhone(normalizedPhone);

    if (!user) {
      throw new NotFoundException('PHONE_NOT_FOUND');
    }

    const resetToken = this.generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.authRepo.updateUser(user.id, {
      resetToken,
      resetTokenExpiry,
    });

    // TODO: Send reset token via SMS provider

    return { message: 'RESET_RESENT' };
  }

  async verifyResetToken(phone: string, token: string) {
    const normalizedPhone = PhoneUtils.normalizePhone(phone);

    const user = await this.authRepo.getUserByPhone(normalizedPhone);
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new BadRequestException('INVALID_RESET_REQUEST');
    }

    if (user.resetToken !== token) {
      throw new BadRequestException('INVALID_RESET_TOKEN');
    }

    if (new Date() > user.resetTokenExpiry) {
      throw new BadRequestException('RESET_TOKEN_EXPIRED');
    }

    return { message: 'RESET_TOKEN_VALID' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { phone, token, newPassword } = resetPasswordDto;

    const normalizedPhone = PhoneUtils.normalizePhone(phone);
    const user = await this.authRepo.getUserByPhone(normalizedPhone);

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new BadRequestException('INVALID_RESET_REQUEST');
    }

    if (user.resetToken !== token) {
      throw new BadRequestException('INVALID_RESET_TOKEN');
    }

    if (new Date() > user.resetTokenExpiry) {
      throw new BadRequestException('RESET_TOKEN_EXPIRED');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await this.authRepo.updateUser(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return { message: 'RESET_SUCCESS' };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    if (currentPassword === newPassword) {
      throw new BadRequestException('NEW_PASSWORD_SAME');
    }

    const user = await this.authRepo.getUserById(userId);
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const isCurrentValid = await this.comparePassword(currentPassword, user.password);
    if (!isCurrentValid) {
      throw new UnauthorizedException('INVALID_CURRENT_PASSWORD');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.authRepo.updateUser(userId, { password: hashedPassword });

    return { message: 'PASSWORD_CHANGED' };
  }

  private async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, AuthService.BCRYPT_SALT_ROUNDS);
  }

  private async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  private generateToken(userId: number, phone: string): string {
    const payload: JwtPayload = { sub: userId, phone };
    return this.jwtService.sign(payload);
  }

  private generateResetToken(): string {
    // TODO: Replace with cryptographically secure generator
    return '11111';
  }
  private generateVerifyPhoneToken(): string {
    // TODO: Replace with cryptographically secure generator
    return '11111';
  }
}
