import { Injectable } from '@nestjs/common';

import { RedisService } from 'src/common/redis/redis.service';
import { StatsOverviewQueryDto } from './dto/stats-overview-query.dto';
import {
  STATS_OVERVIEW_CACHE_TTL_SECONDS,
  statsOverviewCacheKey,
} from './stats.constants';
import { buildStatsOverview, StatsOverviewResponse } from './stats.mapper';
import { StatsRepo } from './stats.repo';

@Injectable()
export class StatsService {
  constructor(
    private readonly repo: StatsRepo,
    private readonly redis: RedisService,
  ) {}

  async getOverview(query: StatsOverviewQueryDto): Promise<StatsOverviewResponse> {
    const months = query.months ?? 6;
    const cacheKey = statsOverviewCacheKey(months);

    const cached = await this.redis.getJson<StatsOverviewResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const overview = await this.fetchOverview(months);
    await this.redis.setJson(cacheKey, overview, STATS_OVERVIEW_CACHE_TTL_SECONDS);

    return overview;
  }

  private async fetchOverview(months: number): Promise<StatsOverviewResponse> {
    const [summaryRaw, userGrowth, listingsGrowth, propertyTypeRows] = await Promise.all([
      this.repo.getSummaryRaw(),
      this.repo.getUserGrowthRaw(months),
      this.repo.getListingsGrowthRaw(months),
      this.repo.getListingsByPropertyTypeRaw(),
    ]);

    return buildStatsOverview(summaryRaw, userGrowth, listingsGrowth, propertyTypeRows);
  }
}
