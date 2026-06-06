import { Injectable } from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';

import { DrizzleService } from 'src/modules/db/drizzle.service';
import { reports, SelectReport } from 'src/modules/db/schemas/schema-index';
import { AdminReportQueryDto } from './dto/report-query.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Injectable()
export class ReportsRepo {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findAll(query: AdminReportQueryDto) {
    const { page = 1, limit = 20, status } = query;
    const offset = (page - 1) * limit;
    const whereClause = status ? eq(reports.status, status) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select()
        .from(reports)
        .where(whereClause)
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset),
      this.drizzleService.db.select({ total: count() }).from(reports).where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async updateStatus(
    id: number,
    status: UpdateReportStatusDto['status'],
  ): Promise<SelectReport | null> {
    const [updated] = await this.drizzleService.db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, id))
      .returning();

    return updated ?? null;
  }
}
