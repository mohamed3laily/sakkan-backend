import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { LogAction } from 'src/common/logging';
import { SubscriptionPlansRepo } from './subscription-plans.repo';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  private readonly logger = new Logger(SubscriptionPlansService.name);

  constructor(private readonly repo: SubscriptionPlansRepo) {}

  async getPlans() {
    return this.repo.findAll();
  }

  async getPlanById(id: number) {
    const plan = await this.repo.findById(id);
    if (!plan) {
      throw new NotFoundException('NOT_FOUND');
    }
    return plan;
  }

  async updatePlan(adminId: number, id: number, dto: UpdateSubscriptionPlanDto) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('NOT_FOUND');
    }

    const updated = await this.repo.update(id, dto);
    if (!updated) {
      throw new NotFoundException('NOT_FOUND');
    }

    this.logger.log(
      ({ action: LogAction.ADMIN_PLAN_UPDATED, adminId, planId: id }),
      'Admin updated subscription plan',
    );

    return updated;
  }
}
