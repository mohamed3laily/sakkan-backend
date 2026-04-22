import { Injectable, NotFoundException } from '@nestjs/common';

import { UserRepo } from '../../user/user.repo';
import { CreditsService } from '../credits/credits.service';
import type { PurchaseCreditsDto, SubscribeDto } from '../dto';
import { PaymobService, type PaymobOrderResult } from '../paymob/paymob.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class PaymobCheckoutService {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly paymobService: PaymobService,
    private readonly creditsService: CreditsService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async purchaseCredits(userId: number, dto: PurchaseCreditsDto) {
    const profile = await this.userRepo.getUserById(userId);
    if (!profile) {
      throw new NotFoundException('NOT_FOUND');
    }

    const product = await this.creditsService.getProduct(dto.productKey);

    const billing = this.buildBillingData(profile.phone, profile.firstName, profile.lastName);

    const paymentType =
      dto.productKey === 'featured_bundle'
        ? 'featured_bundle'
        : dto.productKey === 'serious_single'
          ? 'serious_request'
          : 'featured_single';

    const result = await this.paymobService.createOrder({
      userId,
      amountEgp: product.priceEgp,
      paymentType,
      metadata: {
        credit_type: product.creditType,
        credits_to_add: product.credits,
        product: dto.productKey,
      },
      billingData: billing,
      redirectionUrl: dto.redirectionUrl,
    });

    return {
      internalPaymentId: result.internalPaymentId,
      amount: product.priceEgp,
      credits: product.credits,
      paymentUrl: result.paymentUrl,
      paymob: this.paymobForFlutter(result),
    };
  }

  async subscribeWithPaymob(userId: number, dto: SubscribeDto) {
    const profile = await this.userRepo.getUserById(userId);
    if (!profile) {
      throw new NotFoundException('NOT_FOUND');
    }

    const plan = await this.subscriptionService.getPlanById(dto.planId);
    const billing = this.buildBillingData(profile.phone, profile.firstName, profile.lastName);

    const result = await this.paymobService.createOrder({
      userId,
      amountEgp: plan.priceEgp,
      paymentType: 'subscription',
      metadata: { plan_id: plan.id },
      billingData: billing,
    });

    return {
      internalPaymentId: result.internalPaymentId,
      paymentUrl: result.paymentUrl,
      paymob: this.paymobForFlutter(result),
      plan: {
        name: plan.name,
        displayNameEn: plan.displayNameEn,
        displayNameAr: plan.displayNameAr,
        amount: plan.priceEgp,
        billingPeriod: plan.billingPeriod,
      },
    };
  }

  /**
   * Fields aligned with Paymob Flutter plugin: `Paymob.pay(publicKey:, clientSecret:)`.
   * Use `unifiedCheckoutUrl` in a WebView if you skip the native SDK.
   */
  private paymobForFlutter(result: PaymobOrderResult) {
    return {
      publicKey: result.publicKey,
      clientSecret: result.clientSecret,
      unifiedCheckoutUrl: result.paymentUrl,
      checkoutFlow: result.checkoutFlow,
      paymobOrderId: result.paymobOrderId,
    };
  }

  private buildBillingData(phone: string, firstName: string, lastName: string) {
    const safeLocal = phone.replace(/\D/g, '') || '0000000000';
    return {
      firstName: firstName || 'User',
      lastName: lastName || '',
      email: `${safeLocal}@users.sakkan.app`,
      phone: phone.startsWith('+') ? phone : `+${phone}`,
    };
  }
}
