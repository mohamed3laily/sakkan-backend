import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  create(@Req() req, @Body() createReportDto: CreateReportDto) {
    const reporterId = req.user.id;
    return this.reportService.create(reporterId, createReportDto);
  }
}
