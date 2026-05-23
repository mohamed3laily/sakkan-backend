import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportRepository } from './report.repo';
import { LogAction } from 'src/common/logging';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly reportRepository: ReportRepository) {}

  async create(userId: number, createReportDto: CreateReportDto) {
    const { reportableType, reportableId, reason, description } = createReportDto;

    const existingReport = await this.reportRepository.findPendingByReporterAndEntity(
      userId,
      reportableType,
      reportableId,
    );

    if (existingReport) {
      this.logger.warn(
        ({
          action: LogAction.REPORT_DUPLICATE_REJECTED,
          userId,
          reportableType,
          reportableId,
        }),
        'Duplicate report rejected',
      );
      throw new BadRequestException('ALREADY_REPORTED');
    }

    const report = await this.reportRepository.create({
      userId,
      reportableType,
      reportableId,
      reason,
      description,
      status: 'PENDING',
    });

    this.logger.log(
      ({
        action: LogAction.REPORT_CREATED,
        userId,
        reportId: report.id,
        reportableType,
        reportableId,
        reason,
      }),
      'Report created',
    );

    return report;
  }
}
