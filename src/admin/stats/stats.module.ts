import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/modules/db/drizzle.module';
import { StatsController } from './stats.controller';
import { StatsRepo } from './stats.repo';
import { StatsService } from './stats.service';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
  imports: [DrizzleModule, RedisModule],
  controllers: [StatsController],
  providers: [StatsService, StatsRepo],
})
export class StatsModule {}
