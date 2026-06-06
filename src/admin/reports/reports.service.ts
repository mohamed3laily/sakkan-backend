import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { LogAction } from 'src/common/logging';
import { PaginationService } from 'src/common/services/pagination.service';
import { AdminReportQueryDto } from './dto/report-query.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportsRepo } from './reports.repo';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly repo: ReportsRepo,
    private readonly paginationService: PaginationService,
  ) {}

  async getReports(query: AdminReportQueryDto) {
    const { page = 1, limit = 20 } = query;
    const { data, total } = await this.repo.findAll(query);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async updateStatus(adminId: number, reportId: number, dto: UpdateReportStatusDto) {
    const result = await this.repo.updateStatus(reportId, dto.status);
    if (!result) {
      throw new NotFoundException('REPORT_NOT_FOUND');
    }

    this.logger.log(
      ({
        action: LogAction.ADMIN_REPORT_STATUS_UPDATED,
        adminId,
        reportId,
        status: dto.status,
      }),
      'Admin updated report status',
    );

    return result;
  }
}
