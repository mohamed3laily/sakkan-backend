import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { AuthRepo } from './auth.repo';

@Injectable()
export class AuthService {
  constructor(
    private authRepo: AuthRepo,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: AdminRegisterDto) {
    const { phone, password } = registerDto;
    const existing = await this.authRepo.getByPhone(phone);
    if (existing) {
      throw new ConflictException('PHONE_EXISTS');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await this.authRepo.insert(registerDto, hashedPassword);
    return { id: admin.id, name: admin.name, phone: admin.phone };
  }

  async login(loginDto: AdminLoginDto) {
    const { phone, password } = loginDto;
    const admin = await this.authRepo.getByPhone(phone);
    if (!admin) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    const payload = { sub: admin.id, phone: admin.phone, name: admin.name };
    return {
      accessToken: this.jwtService.sign(payload),
      admin: { id: admin.id, name: admin.name, phone: admin.phone },
    };
  }
}
