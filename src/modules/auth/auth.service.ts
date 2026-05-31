import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { AuthRepo } from './auth.repo';
import { TorvoSmsService } from '../sms/torvo-sms.service';
import { PhoneUtils } from './utils/phone.utils';
import { LogAction } from 'src/common/logging';
import { UserSessionService } from './user-session.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private static readonly BCRYPT_SALT_ROUNDS = 10;
  private static readonly OTP_LENGTH = 5;
  private static readonly REFRESH_TOKEN_BYTES = 32;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private authRepo: AuthRepo,
    private jwtService: JwtService,
    private torvoSms: TorvoSmsService,
    private userSessionService: UserSessionService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, phone, password, type, deviceLabel, installationId } = registerDto;

    const normalizedPhone = PhoneUtils.normalizePhone(phone);
    const existingUser = await this.authRepo.getUserByPhone(normalizedPhone);

    if (existingUser) {
      this.logger.warn({ action: LogAction.USER_REGISTER, reason: 'PHONE_EXISTS' }, 'Register failed');
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
    try {
      await this.torvoSms.sendQuickSms(
        normalizedPhone,
        this.torvoSms.buildPhoneVerificationMessage(verifyPhoneToken),
      );
    } catch (err) {
      throw err;
    }
    const { accessToken, refreshToken, installationId: issuedInstallationId } =
      await this.issueTokenPair(newUser.id, newUser.phone, { deviceLabel, installationId });

    this.logger.log({ userId: newUser.id, action: LogAction.USER_REGISTER }, 'User registered');

    return {
      message: 'REGISTER_OTP_SENT',
      accessToken,
      refreshToken,
      installationId: issuedInstallationId,
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
      this.logger.warn(
        { action: LogAction.USER_VERIFY_PHONE, reason: 'INVALID_VERIFICATION_REQUEST' },
        'Phone verification failed',
      );
      throw new BadRequestException('INVALID_VERIFICATION_REQUEST');
    }

    if (new Date() > user.verifyPhoneTokenExpiry) {
      this.logger.warn(
        { action: LogAction.USER_VERIFY_PHONE, reason: 'VERIFICATION_TOKEN_EXPIRED' },
        'Phone verification failed',
      );
      throw new BadRequestException('VERIFICATION_TOKEN_EXPIRED');
    }

    // TODO: Use crypted tokens and compare using a timing-safe method
    const valid = user.verifyPhoneToken === token;

    if (!valid) {
      this.logger.warn(
        { action: LogAction.USER_VERIFY_PHONE, reason: 'INVALID_VERIFICATION_TOKEN' },
        'Phone verification failed',
      );
      throw new BadRequestException('INVALID_VERIFICATION_TOKEN');
    }

    await this.authRepo.updateUser(user.id, {
      verifiedPhoneAt: new Date(),
      verifyPhoneToken: null,
      verifyPhoneTokenExpiry: null,
    });

    this.logger.log({ userId: user.id, action: LogAction.USER_VERIFY_PHONE }, 'Phone verified');

    return { message: 'PHONE_VERIFIED' };
  }

  async resendVerifyPhone(phone: string) {
    const normalizedPhone = PhoneUtils.normalizePhone(phone);

    const user = await this.authRepo.getUserByPhone(normalizedPhone);
    if (!user) {
      this.logger.warn(
        { action: LogAction.USER_RESEND_VERIFY_PHONE, reason: 'INVALID_VERIFICATION_REQUEST' },
        'Resend verify phone failed',
      );
      throw new BadRequestException('INVALID_VERIFICATION_REQUEST');
    }

    const verifyPhoneToken = this.generateVerifyPhoneToken();
    const verifyPhoneTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.authRepo.updateUser(user.id, {
      verifyPhoneToken,
      verifyPhoneTokenExpiry,
    });

    await this.torvoSms.sendQuickSms(
      normalizedPhone,
      this.torvoSms.buildPhoneVerificationMessage(verifyPhoneToken),
    );

    return { message: 'VERIFY_OTP_SENT' };
  }

  async login(loginDto: LoginDto) {
    const { phone, password, deviceLabel, installationId } = loginDto;

    let normalizedPhone: string;
    try {
      normalizedPhone = PhoneUtils.normalizePhone(phone);
    } catch {
      this.logger.warn({ action: LogAction.USER_LOGIN, reason: 'INVALID_CREDENTIALS' }, 'Login failed');
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const user = await this.authRepo.getUserByPhone(normalizedPhone);

    if (!user) {
      this.logger.warn({ action: LogAction.USER_LOGIN, reason: 'INVALID_CREDENTIALS' }, 'Login failed');
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn({ action: LogAction.USER_LOGIN, reason: 'INVALID_CREDENTIALS' }, 'Login failed');
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (user.deactivatedAt) {
      this.logger.warn({ action: LogAction.USER_LOGIN, reason: 'ACCOUNT_DEACTIVATED' }, 'Login failed');
      throw new ForbiddenException('ACCOUNT_DEACTIVATED');
    }

    const { accessToken, refreshToken, installationId: issuedInstallationId } =
      await this.issueTokenPair(user.id, user.phone, { deviceLabel, installationId });

    this.logger.log({ userId: user.id, action: LogAction.USER_LOGIN }, 'User logged in');

    return {
      accessToken,
      refreshToken,
      installationId: issuedInstallationId,
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

    await this.torvoSms.sendQuickSms(
      normalizedPhone,
      this.torvoSms.buildPasswordResetMessage(resetToken),
    );

    this.logger.log(
      { userId: user.id, action: LogAction.USER_PASSWORD_RESET_REQUEST },
      'Password reset requested',
    );

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

    await this.torvoSms.sendQuickSms(
      normalizedPhone,
      this.torvoSms.buildPasswordResetMessage(resetToken),
    );

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

    await this.userSessionService.revokeAllForUser(user.id);

    this.logger.log(
      { userId: user.id, action: LogAction.USER_PASSWORD_RESET_COMPLETE },
      'Password reset completed',
    );

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
    await this.userSessionService.revokeAllForUser(userId);

    return { message: 'PASSWORD_CHANGED' };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    const session = await this.userSessionService.validateRefreshToken(refreshToken);

    if (!session) {
      this.logger.warn(
        { action: LogAction.USER_TOKEN_REFRESH, reason: 'INVALID_REFRESH_TOKEN' },
        'Token refresh failed',
      );
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    const user = await this.authRepo.getUserById(session.userId);
    if (!user) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    if (user.deactivatedAt) {
      await this.userSessionService.revokeSession(session.id);
      throw new ForbiddenException('ACCOUNT_DEACTIVATED');
    }

    const tokens = await this.rotateTokenPair(session.id, session.userId, user.phone);

    this.logger.log({ userId: user.id, action: LogAction.USER_TOKEN_REFRESH }, 'Tokens refreshed');

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      installationId: session.deviceFingerprint,
    };
  }

  async logout(sessionId: number) {
    await this.userSessionService.revokeSession(sessionId);

    this.logger.log({ sessionId, action: LogAction.USER_LOGOUT }, 'User logged out');

    return { message: 'LOGOUT_SUCCESS' };
  }

  private async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, AuthService.BCRYPT_SALT_ROUNDS);
  }

  private async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  private generateAccessToken(userId: number, phone: string, sessionId: number): string {
    const payload: JwtPayload = { sub: userId, phone, sid: sessionId };
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(AuthService.REFRESH_TOKEN_BYTES).toString('hex');
  }

  private async issueTokenPair(
    userId: number,
    phone: string,
    options?: { deviceLabel?: string; installationId?: string },
  ): Promise<{ accessToken: string; refreshToken: string; installationId: string }> {
    const refreshToken = this.generateRefreshToken();
    const { sessionId, installationId } = await this.userSessionService.establishSession(
      userId,
      refreshToken,
      options,
    );
    const accessToken = this.generateAccessToken(userId, phone, sessionId);
    return { accessToken, refreshToken, installationId };
  }

  private async rotateTokenPair(
    sessionId: number,
    userId: number,
    phone: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.generateRefreshToken();
    await this.userSessionService.rotateRefreshToken(sessionId, refreshToken);
    const accessToken = this.generateAccessToken(userId, phone, sessionId);
    return { accessToken, refreshToken };
  }

  private generateResetToken(): string {
    return this.generateNumericOtp(AuthService.OTP_LENGTH);
  }

  private generateVerifyPhoneToken(): string {
    return this.generateNumericOtp(AuthService.OTP_LENGTH);
  }

  private generateNumericOtp(digits: number): string {
    const max = 10 ** digits;
    return String(crypto.randomInt(0, max)).padStart(digits, '0');
  }
}
