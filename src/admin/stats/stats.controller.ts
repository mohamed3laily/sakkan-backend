import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { StatsOverviewQueryDto } from './dto/stats-overview-query.dto';
import { StatsService } from './stats.service';

@UseGuards(AdminJwtAuthGuard)
@Controller('')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('overview')
  getOverview(@Query() query: StatsOverviewQueryDto) {
    return this.service.getOverview(query);
  }
}
