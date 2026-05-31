import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { AuthRepo } from './auth.repo';
import { LogAction } from 'src/common/logging';
import { AdminSessionService } from './admin-session.service';
import { AdminJwtPayload } from './interfaces/admin-jwt-payload.interface';
import { RefreshTokenDto } from 'src/modules/auth/dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private static readonly BCRYPT_SALT_ROUNDS = 10;
  private static readonly REFRESH_TOKEN_BYTES = 32;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private authRepo: AuthRepo,
    private jwtService: JwtService,
    private adminSessionService: AdminSessionService,
  ) {}

  async register(registerDto: AdminRegisterDto) {
    const { phone, password } = registerDto;
    const existing = await this.authRepo.getByPhone(phone);
    if (existing) {
      this.logger.warn(
        { action: LogAction.ADMIN_REGISTER, reason: 'PHONE_EXISTS' },
        'Admin register failed',
      );
      throw new ConflictException('PHONE_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, AuthService.BCRYPT_SALT_ROUNDS);
    const admin = await this.authRepo.insert(registerDto, hashedPassword);

    const { accessToken, refreshToken } = await this.issueTokenPair(
      admin.id,
      admin.phone,
      admin.name,
    );

    this.logger.log(
      { action: LogAction.ADMIN_REGISTER, adminId: admin.id },
      'Admin registered',
    );

    return {
      accessToken,
      refreshToken,
      admin: { id: admin.id, name: admin.name, phone: admin.phone, type: admin.type },
    };
  }

  async login(loginDto: AdminLoginDto) {
    const { phone, password } = loginDto;
    const admin = await this.authRepo.getByPhone(phone);
    if (!admin) {
      this.logger.warn(
        { action: LogAction.ADMIN_LOGIN, reason: 'INVALID_CREDENTIALS' },
        'Admin login failed',
      );
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (admin.revokedAt) {
      this.logger.warn(
        { action: LogAction.ADMIN_LOGIN, reason: 'ADMIN_REVOKED' },
        'Admin login failed',
      );
      throw new UnauthorizedException('ADMIN_REVOKED');
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      this.logger.warn(
        { action: LogAction.ADMIN_LOGIN, reason: 'INVALID_CREDENTIALS' },
        'Admin login failed',
      );
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const { accessToken, refreshToken } = await this.issueTokenPair(
      admin.id,
      admin.phone,
      admin.name,
    );

    this.logger.log(
      { action: LogAction.ADMIN_LOGIN, adminId: admin.id },
      'Admin logged in',
    );

    return {
      accessToken,
      refreshToken,
      admin: { id: admin.id, name: admin.name, phone: admin.phone, type: admin.type },
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    const session = await this.adminSessionService.validateRefreshToken(refreshToken);

    if (!session) {
      this.logger.warn(
        { action: LogAction.ADMIN_TOKEN_REFRESH, reason: 'INVALID_REFRESH_TOKEN' },
        'Admin token refresh failed',
      );
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    const admin = await this.authRepo.getById(session.adminId);
    if (!admin || admin.revokedAt) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    const tokens = await this.rotateTokenPair(
      session.id,
      admin.id,
      admin.phone,
      admin.name,
    );

    this.logger.log(
      { action: LogAction.ADMIN_TOKEN_REFRESH, adminId: admin.id },
      'Admin tokens refreshed',
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(sessionId: number) {
    await this.adminSessionService.revokeSession(sessionId);

    this.logger.log({ sessionId, action: LogAction.ADMIN_LOGOUT }, 'Admin logged out');

    return { message: 'LOGOUT_SUCCESS' };
  }

  private generateAccessToken(
    adminId: number,
    phone: string,
    name: string,
    sessionId: number,
  ): string {
    const payload: AdminJwtPayload = { sub: adminId, phone, name, sid: sessionId };
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(AuthService.REFRESH_TOKEN_BYTES).toString('hex');
  }

  private async issueTokenPair(
    adminId: number,
    phone: string,
    name: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.generateRefreshToken();
    const { sessionId } = await this.adminSessionService.establishSession(adminId, refreshToken);
    const accessToken = this.generateAccessToken(adminId, phone, name, sessionId);
    return { accessToken, refreshToken };
  }

  private async rotateTokenPair(
    sessionId: number,
    adminId: number,
    phone: string,
    name: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.generateRefreshToken();
    await this.adminSessionService.rotateRefreshToken(sessionId, refreshToken);
    const accessToken = this.generateAccessToken(adminId, phone, name, sessionId);
    return { accessToken, refreshToken };
  }
}
