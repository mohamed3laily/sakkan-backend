import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AuthenticatedAdmin } from '../auth/interfaces/authenticated-admin.interface';
import { AdminReportQueryDto } from './dto/report-query.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportsService } from './reports.service';

@UseGuards(AdminJwtAuthGuard)
@Controller('')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  async getReports(@Query() query: AdminReportQueryDto) {
    return this.service.getReports(query);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportStatusDto,
  ) {
    return this.service.updateStatus(admin.id, id, dto);
  }
}
