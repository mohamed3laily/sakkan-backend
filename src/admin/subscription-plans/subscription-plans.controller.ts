import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';

import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AuthenticatedAdmin } from '../auth/interfaces/authenticated-admin.interface';
import { SubscriptionPlansService } from './subscription-plans.service';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@UseGuards(AdminJwtAuthGuard)
@Controller('')
export class SubscriptionPlansController {
  constructor(private readonly service: SubscriptionPlansService) {}

  @Get()
  async getPlans() {
    return this.service.getPlans();
  }

  @Get(':id')
  async getPlanById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getPlanById(id);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id')
  async updatePlan(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.service.updatePlan(admin.id, id, dto);
  }
}
