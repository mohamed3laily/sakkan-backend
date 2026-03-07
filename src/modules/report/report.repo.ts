import { Injectable } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { InsertReport, reports, SelectReport } from '../db/schemas/schema-index';
import { ReportableType } from './dto/create-report.dto';

@Injectable()
export class ReportRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: InsertReport): Promise<SelectReport> {
    const [report] = await this.drizzle.db.insert(reports).values(data).returning();

    return report;
  }

  async findPendingByReporterAndEntity(
    userId: number,
    reportableType: ReportableType,
    reportableId: number,
  ): Promise<SelectReport | null> {
    const [report] = await this.drizzle.db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.userId, userId),
          eq(reports.reportableType, reportableType),
          eq(reports.reportableId, reportableId),
          eq(reports.status, 'PENDING'),
        ),
      )
      .limit(1);

    return report || null;
  }
}
