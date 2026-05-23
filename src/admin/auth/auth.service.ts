import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { AuthRepo } from './auth.repo';
import { LogAction } from 'src/common/logging';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private authRepo: AuthRepo,
    private jwtService: JwtService,
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await this.authRepo.insert(registerDto, hashedPassword);
    this.logger.log(
      { action: LogAction.ADMIN_REGISTER, adminId: admin.id },
      'Admin registered',
    );
    return { id: admin.id, name: admin.name, phone: admin.phone };
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
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      this.logger.warn(
        { action: LogAction.ADMIN_LOGIN, reason: 'INVALID_CREDENTIALS' },
        'Admin login failed',
      );
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    const payload = { sub: admin.id, phone: admin.phone, name: admin.name };
    this.logger.log(
      { action: LogAction.ADMIN_LOGIN, adminId: admin.id },
      'Admin logged in',
    );
    return {
      accessToken: this.jwtService.sign(payload),
      admin: { id: admin.id, name: admin.name, phone: admin.phone },
    };
  }
}
