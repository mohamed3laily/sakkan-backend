import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/modules/db/drizzle.module';
import { ReportsController } from './reports.controller';
import { ReportsRepo } from './reports.repo';
import { ReportsService } from './reports.service';

@Module({
  imports: [DrizzleModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepo],
})
export class ReportsModule {}
