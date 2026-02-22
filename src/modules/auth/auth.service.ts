import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RequestResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { AuthRepo } from './auth.repo';
import { PhoneUtils } from './utils/phone.utils';

@Injectable()
export class AuthService {
  constructor(
    private authRepo: AuthRepo,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, phone, password } = registerDto;

    const normalizedPhone = PhoneUtils.normalizePhone(phone);
    const existingUser = await this.authRepo.getUserByPhone(normalizedPhone);

    if (existingUser) {
      throw new ConflictException('PHONE_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyPhoneToken = this.generateVerifyPhoneToken();
    const verifyPhoneTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const [newUser] = await this.authRepo.insertUser(
      {
        firstName,
        lastName,
        phone: normalizedPhone,
        password: hashedPassword,
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

    const isPasswordValid = await bcrypt.compare(password, user.password);
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
      return { message: 'PHONE_WRONG' };
    }

    const user = await this.authRepo.getUserByPhone(normalizedPhone);

    if (!user) {
      return { message: 'PHONE_NOT_FOUND' };
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.authRepo.updateUser(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return { message: 'RESET_SUCCESS' };
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
