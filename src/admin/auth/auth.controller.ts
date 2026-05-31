import { Controller, Post, Body, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { RefreshTokenDto } from 'src/modules/auth/dto/refresh-token.dto';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AuthenticatedAdmin } from './interfaces/authenticated-admin.interface';
import { AuthThrottle } from 'src/common/decorators/auth-throttle.decorator';

@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @AuthThrottle()
  @Post('register')
  async register(@Body() dto: AdminRegisterDto) {
    return this.authService.register(dto);
  }

  @AuthThrottle()
  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.authService.login(dto);
  }

  @AuthThrottle()
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Post('logout')
  async logout(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.authService.logout(admin.sessionId);
  }
}
