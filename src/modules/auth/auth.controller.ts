import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RequestResetDto,
  ResetPasswordDto,
  VerifyResetDto,
} from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AllowUnverified } from './decorators/allow-unverified.decorator';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @AllowUnverified()
  @Post('verify-phone')
  verifyPhone(
    @Body() dto: VerifyPhoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.verifyPhone(user.phone, dto.token);
  }

  @Post('resend-verify-otp')
  @UseGuards(JwtAuthGuard)
  @AllowUnverified()
  async resendVerifyPhone(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.resendVerifyPhone(user.phone);
  }

  @Post('request-reset')
  async requestReset(@Body() requestResetDto: RequestResetDto) {
    return this.authService.requestPasswordReset(requestResetDto);
  }

  @Post('verify-reset-otp')
  async verifyReset(@Body() dto: VerifyResetDto) {
    return this.authService.verifyResetToken(dto.phone, dto.token);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
