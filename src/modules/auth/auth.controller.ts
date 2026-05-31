import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestResetDto, ResetPasswordDto, VerifyResetDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AllowUnverified } from './decorators/allow-unverified.decorator';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthThrottle, StrictAuthThrottle } from 'src/common/decorators/auth-throttle.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @AuthThrottle()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @AuthThrottle()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @AuthThrottle()
  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @AllowUnverified()
  @Post('logout')
  async logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @AllowUnverified()
  @Post('verify-phone')
  verifyPhone(@Body() dto: VerifyPhoneDto, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.verifyPhone(user.phone, dto.token);
  }

  @Post('resend-verify-otp')
  @UseGuards(JwtAuthGuard)
  @AllowUnverified()
  async resendVerifyPhone(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.resendVerifyPhone(user.phone);
  }

  @StrictAuthThrottle()
  @Post('request-reset')
  async requestReset(@Body() requestResetDto: RequestResetDto) {
    return this.authService.requestPasswordReset(requestResetDto);
  }

  @Post('resend-reset-otp')
  async resendResetOtp(@Body() requestResetDto: RequestResetDto) {
    return this.authService.resendResetOtp(requestResetDto);
  }

  @StrictAuthThrottle()
  @Post('verify-reset-otp')
  async verifyReset(@Body() dto: VerifyResetDto) {
    return this.authService.verifyResetToken(dto.phone, dto.token);
  }

  @StrictAuthThrottle()
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }
}
