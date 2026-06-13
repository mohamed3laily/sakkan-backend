import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { AppleIAPService } from './apple-iap.service';
import { VerifyApplePurchaseDto } from './dto/verify-apple-purchase.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class AppleIAPController {
  constructor(private readonly appleIAPService: AppleIAPService) {}

  @Post('apple/verify-purchase')
  @HttpCode(HttpStatus.OK)
  verifyPurchase(@Body() dto: VerifyApplePurchaseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.appleIAPService.verifyAndFulfill(user.id, dto);
  }
}
