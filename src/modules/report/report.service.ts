import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportRepository } from './report.repo';

@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async create(userId: number, createReportDto: CreateReportDto) {
    const { reportableType, reportableId, reason, description } = createReportDto;

    const existingReport = await this.reportRepository.findPendingByReporterAndEntity(
      userId,
      reportableType,
      reportableId,
    );

    if (existingReport) {
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

    return report;
  }
}
