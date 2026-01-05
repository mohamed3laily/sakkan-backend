import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { DrizzleService } from 'src/modules/db/drizzle.service';
import { users } from 'src/modules/db/schemas/user/user';
import { LoginDto } from './dto/login.dto';
import { RequestResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { AuthRepo } from './auth.repo';
import { PhoneUtils } from './utils/phone.utils';

@Injectable()
export class AuthService {
  constructor(
    private drizzleService: DrizzleService,
    private authRepo: AuthRepo,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, phone, password } = registerDto;

    const normalizedPhone = PhoneUtils.normalizePhone(phone);
    const existingUser = await this.authRepo.getUserByPhone(normalizedPhone);

    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await this.authRepo.insertUser({
      firstName,
      lastName,
      phone: normalizedPhone,
      password: hashedPassword,
    });

    const token = this.generateToken(newUser.id, newUser.phone);

    return {
      accessToken: token,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { phone, password } = loginDto;

    let normalizedPhone: string;
    try {
      normalizedPhone = PhoneUtils.normalizePhone(phone);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.authRepo.getUserByPhone(normalizedPhone);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.phone);

    return {
      accessToken: token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    };
  }

  async requestPasswordReset(requestResetDto: RequestResetDto) {
    const { phone } = requestResetDto;

    let normalizedPhone: string;
    try {
      normalizedPhone = PhoneUtils.normalizePhone(phone);
    } catch (error) {
      return {
        message: 'If the phone number exists, a reset token will be sent',
      };
    }

    const user = await this.authRepo.getUserByPhone(normalizedPhone);

    if (!user) {
      return {
        message: 'If the phone number exists, a reset token will be sent',
      };
    }

    const resetToken = this.generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await this.authRepo.updateUser(user.id, {
      resetToken,
      resetTokenExpiry,
    });

    // TODO: Send reset token via SMS

    return {
      message: 'If the phone number exists, a reset token will be sent',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.authRepo.getUserByResetToken(token);

    if (!user || !user.resetTokenExpiry) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > user.resetTokenExpiry) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.authRepo.updateUser(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return { message: 'Password reset successful' };
  }

  private generateToken(userId: number, phone: string): string {
    const payload: JwtPayload = { sub: userId, phone };
    return this.jwtService.sign(payload);
  }

  private generateResetToken(): string {
    return '11111'; // TODO: Implement proper token generation
  }
}
