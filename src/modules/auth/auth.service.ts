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
import { UserSessionService, type RefreshResolution } from './user-session.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  createSessionAuthException,
  toPublicRevokeCode,
  type PublicSessionAuthCode,
} from './session-auth-codes';

@Injectable()
export class AuthService {
  private static readonly BCRYPT_SALT_ROUNDS = 10;
  private static readonly OTP_DIGITS = 5;
  private static readonly REFRESH_TOKEN_BYTES = 32;
  private static readonly OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

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
    const verifyPhoneToken = this.generateNumericOtp(AuthService.OTP_DIGITS);
    const verifyPhoneTokenExpiry = new Date(Date.now() + AuthService.OTP_EXPIRY_MS);

    const [newUser] = await this.authRepo.insertUser(
      { firstName, lastName, phone: normalizedPhone, password: hashedPassword, type },
      verifyPhoneToken,
      verifyPhoneTokenExpiry,
    );

    await this.torvoSms.sendQuickSms(
      normalizedPhone,
      this.torvoSms.buildPhoneVerificationMessage(verifyPhoneToken),
    );

    const { accessToken, refreshToken, installationId: issuedInstallationId } =
      await this.issueTokenPair(newUser.id, newUser.phone, { deviceLabel, installationId });

    this.logger.log({ userId: newUser.id, action: LogAction.USER_REGISTER }, 'User registered');

    return {
      message: 'REGISTER_OTP_SENT',
      accessToken,
      refreshToken,
      installationId: issuedInstallationId,
      user: this.formatUserSummary(newUser),
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
    if (user.verifyPhoneToken !== token) {
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

    const verifyPhoneToken = this.generateNumericOtp(AuthService.OTP_DIGITS);
    const verifyPhoneTokenExpiry = new Date(Date.now() + AuthService.OTP_EXPIRY_MS);

    await this.authRepo.updateUser(user.id, { verifyPhoneToken, verifyPhoneTokenExpiry });
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
    const isPasswordValid = user && (await this.comparePassword(password, user.password));

    if (!user || !isPasswordValid) {
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
      user: this.formatUserSummary(user),
    };
  }

  async requestPasswordReset(requestResetDto: RequestResetDto) {
    return this.sendPasswordResetOtp(requestResetDto.phone, 'RESET_SENT');
  }

  async resendResetOtp(requestResetDto: RequestResetDto) {
    return this.sendPasswordResetOtp(requestResetDto.phone, 'RESET_RESENT');
  }

  async verifyResetToken(phone: string, token: string) {
    const normalizedPhone = PhoneUtils.normalizePhone(phone);
    await this.resolveValidResetUser(normalizedPhone, token);
    return { message: 'RESET_TOKEN_VALID' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { phone, token, newPassword } = resetPasswordDto;

    const normalizedPhone = PhoneUtils.normalizePhone(phone);
    const user = await this.resolveValidResetUser(normalizedPhone, token);

    const hashedPassword = await this.hashPassword(newPassword);
    await this.authRepo.updateUser(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });
    await this.userSessionService.revokeAllForUser(user.id, 'password_reset');

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
    await this.userSessionService.revokeAllForUser(userId, 'password_change');

    return { message: 'PASSWORD_CHANGED' };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    const resolution = await this.userSessionService.resolveRefreshToken(refreshToken);

    this.assertRefreshResolutionValid(resolution);

    const session = resolution.session;
    const user = await this.authRepo.getUserById(session.userId);
    if (!user) {
      throw createSessionAuthException('INVALID_REFRESH_TOKEN');
    }

    if (user.deactivatedAt) {
      await this.userSessionService.revokeSession(session.id, 'account_deactivated');
      throw createSessionAuthException('ACCOUNT_DEACTIVATED');
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
    await this.userSessionService.revokeSession(sessionId, 'logout');
    this.logger.log({ sessionId, action: LogAction.USER_LOGOUT }, 'User logged out');
    return { message: 'LOGOUT_SUCCESS' };
  }

  // Private helpers

  /** Shared flow for both request-reset and resend-reset — generates OTP, saves it, and sends SMS. */
  private async sendPasswordResetOtp(phone: string, successMessage: string) {
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

    const resetToken = this.generateNumericOtp(AuthService.OTP_DIGITS);
    const resetTokenExpiry = new Date(Date.now() + AuthService.RESET_TOKEN_EXPIRY_MS);

    await this.authRepo.updateUser(user.id, { resetToken, resetTokenExpiry });
    await this.torvoSms.sendQuickSms(
      normalizedPhone,
      this.torvoSms.buildPasswordResetMessage(resetToken),
    );

    this.logger.log(
      { userId: user.id, action: LogAction.USER_PASSWORD_RESET_REQUEST },
      'Password reset OTP sent',
    );

    return { message: successMessage };
  }

  /** Validates a password reset token and returns the user if valid; throws otherwise. */
  private async resolveValidResetUser(normalizedPhone: string, token: string) {
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

    return user;
  }

  /** Throws if the refresh resolution is not valid; narrows the type to `{ status: 'valid' }` for callers. */
  private assertRefreshResolutionValid(
    resolution: RefreshResolution,
  ): asserts resolution is Extract<RefreshResolution, { status: 'valid' }> {
    if (resolution.status === 'valid') return;

    const code =
      resolution.status === 'revoked'
        ? toPublicRevokeCode(resolution.reason)
        : resolution.status === 'expired'
          ? 'SESSION_EXPIRED'
          : 'INVALID_REFRESH_TOKEN';

    this.throwRefreshFailure(code);
  }

  /** Logs a refresh failure reason and throws the corresponding session auth exception. */
  private throwRefreshFailure(code: PublicSessionAuthCode): never {
    this.logger.warn(
      { action: LogAction.USER_TOKEN_REFRESH, reason: code },
      'Token refresh failed',
    );
    throw createSessionAuthException(code);
  }

  /** Minimal user shape returned on login/register. */
  private formatUserSummary(user: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    type?: string | null;
    verifiedPhoneAt?: Date | null;
  }) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      ...(user.type !== undefined && { type: user.type }),
      phoneVerified: !!user.verifiedPhoneAt,
    };
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

  private generateNumericOtp(digits: number): string {
    const max = 10 ** digits;
    return String(crypto.randomInt(0, max)).padStart(digits, '0');
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
}
