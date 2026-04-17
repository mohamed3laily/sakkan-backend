import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PaymobCheckoutService } from './checkout/paymob-checkout.service';
import type { PurchaseCreditsDto, SubscribeDto } from './dto';
import { SubscriptionService } from './subscription/subscription.service';
import { SubscriptionWalletService } from './subscription/subscription-wallet.service';
import { Public } from 'src/common/decorators/public.decorator';
import { TranslateInterceptor } from 'src/common/interceptors/translate.interceptor';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TranslateInterceptor)
export class SubscriptionsController {
  constructor(
    private readonly checkoutService: PaymobCheckoutService,
    private readonly subscriptionService: SubscriptionService,
    private readonly walletService: SubscriptionWalletService,
  ) {}

  @Post('purchase/credits')
  purchaseCredits(@Body() dto: PurchaseCreditsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.checkoutService.purchaseCredits(user.id, dto);
  }

  @Post('subscribe')
  subscribe(@Body() dto: SubscribeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.checkoutService.subscribeWithPaymob(user.id, dto);
  }

  @Get('plans')
  @Public()
  getPlans() {
    return this.subscriptionService.getActivePlans();
  }

  @Get('wallet')
  getWallet(@CurrentUser() user: AuthenticatedUser) {
    return this.walletService.getWalletOverview(user.id);
  }

  @Get('devices')
  getDevices(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionService.getActiveDevices(user.id);
  }

  @Post('devices/:sessionId/revoke')
  async revokeDevice(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.subscriptionService.revokeDevice(user.id, sessionId);
    return { success: true };
  }
}
