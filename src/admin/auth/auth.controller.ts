import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';

@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: AdminRegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.authService.login(dto);
  }
}
