import { Injectable, NotFoundException } from '@nestjs/common';

import { UserRepo } from '../../user/user.repo';
import type { CreditProduct } from '../credits/credits.service';
import { CreditsService } from '../credits/credits.service';
import type { PurchaseCreditsDto, SubscribeDto } from '../dto';
import { PaymobService } from '../paymob/paymob.service';
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

    const pricing = this.creditsService.getPricing(dto.product as CreditProduct);
    const billing = this.buildBillingData(profile.phone, profile.firstName, profile.lastName);

    const paymentType =
      dto.product === 'featured_bundle'
        ? 'featured_bundle'
        : dto.product === 'serious_single'
          ? 'serious_request'
          : 'featured_single';

    const result = await this.paymobService.createOrder({
      userId,
      amountEgp: pricing.egp,
      paymentType,
      metadata: {
        credit_type: pricing.type,
        credits_to_add: pricing.credits,
        listing_id: dto.listingId ?? null,
        product: dto.product,
      },
      billingData: billing,
    });

    return {
      paymentUrl: result.paymentUrl,
      internalPaymentId: result.internalPaymentId,
      amount: pricing.egp,
      credits: pricing.credits,
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
      paymentUrl: result.paymentUrl,
      internalPaymentId: result.internalPaymentId,
      plan: {
        name: plan.name,
        displayNameEn: plan.displayNameEn,
        displayNameAr: plan.displayNameAr,
        amount: plan.priceEgp,
        billingPeriod: plan.billingPeriod,
      },
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
