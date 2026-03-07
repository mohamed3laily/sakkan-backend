import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportRepository } from './report.repo';

@Module({
  controllers: [ReportController],
  providers: [ReportService, ReportRepository],
})
export class ReportModule {}
