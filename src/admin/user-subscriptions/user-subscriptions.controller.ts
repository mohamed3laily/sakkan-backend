import { Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';

import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AuthenticatedAdmin } from '../auth/interfaces/authenticated-admin.interface';
import { UserSubscriptionsService } from './user-subscriptions.service';
import { AdminUserSubscriptionQueryDto } from './dto/user-subscription-query.dto';

@UseGuards(AdminJwtAuthGuard)
@Controller('')
export class UserSubscriptionsController {
  constructor(private readonly service: UserSubscriptionsService) {}

  @Get('insights')
  getInsights() {
    return this.service.getInsights();
  }

  @Get()
  getSubscriptions(@Query() query: AdminUserSubscriptionQueryDto) {
    return this.service.getSubscriptions(query);
  }

  @Get(':id')
  getSubscriptionById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getSubscriptionById(id);
  }

  @Patch(':id/cancel')
  cancelSubscription(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.cancelSubscription(admin.id, id);
  }
}
