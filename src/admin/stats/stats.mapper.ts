import { StatsRepo } from './stats.repo';

type MetricWithChange = {
  value: number;
  changePercent: number | null;
};

type GrowthPointRaw = Awaited<ReturnType<StatsRepo['getUserGrowthRaw']>>[number];
type PropertyTypeRowRaw = Awaited<ReturnType<StatsRepo['getListingsByPropertyTypeRaw']>>[number];
type SummaryRaw = Awaited<ReturnType<StatsRepo['getSummaryRaw']>>;

export type StatsOverviewResponse = {
  summary: {
    totalUsers: MetricWithChange;
    totalListings: MetricWithChange;
    activeSubscriptions: MetricWithChange;
    monthlyRevenue: MetricWithChange & { currency: 'EGP' };
  };
  userGrowth: Array<{ month: string; count: number }>;
  listingsGrowth: Array<{ month: string; count: number }>;
  listingsByPropertyType: Array<{
    propertyTypeId: number;
    parent: string | null;
    nameEn: string;
    nameAr: string;
    count: number;
    percentage: number;
  }>;
};

export function buildStatsOverview(
  summaryRaw: SummaryRaw,
  userGrowth: GrowthPointRaw[],
  listingsGrowth: GrowthPointRaw[],
  propertyTypeRows: PropertyTypeRowRaw[],
): StatsOverviewResponse {
  return {
    summary: buildSummary(summaryRaw),
    userGrowth: toGrowthSeries(userGrowth),
    listingsGrowth: toGrowthSeries(listingsGrowth),
    listingsByPropertyType: toPropertyTypeBreakdown(propertyTypeRows),
  };
}

function buildSummary(summaryRaw: SummaryRaw): StatsOverviewResponse['summary'] {
  return {
    totalUsers: metricWithChange(
      summaryRaw.totalUsers,
      summaryRaw.newUsersThisMonth,
      summaryRaw.newUsersLastMonth,
    ),
    totalListings: metricWithChange(
      summaryRaw.totalListings,
      summaryRaw.newListingsThisMonth,
      summaryRaw.newListingsLastMonth,
    ),
    activeSubscriptions: metricWithChange(
      summaryRaw.activeSubscriptions,
      summaryRaw.newSubscriptionsThisMonth,
      summaryRaw.newSubscriptionsLastMonth,
    ),
    monthlyRevenue: {
      value: summaryRaw.monthlyRevenue,
      currency: 'EGP',
      changePercent: changePercent(summaryRaw.monthlyRevenue, summaryRaw.monthlyRevenueLastMonth),
    },
  };
}

function toGrowthSeries(rows: GrowthPointRaw[]) {
  return rows.map(({ month, count }) => ({ month, count }));
}

function toPropertyTypeBreakdown(rows: PropertyTypeRowRaw[]) {
  const totalWithType = rows.reduce((sum, row) => sum + row.count, 0);

  return rows
    .map((row) => ({
      propertyTypeId: row.propertyTypeId,
      parent: row.parent,
      nameEn: row.nameEn,
      nameAr: row.nameAr,
      count: row.count,
      percentage: totalWithType === 0 ? 0 : Math.round((row.count / totalWithType) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function metricWithChange(value: number, thisMonth: number, lastMonth: number): MetricWithChange {
  return {
    value,
    changePercent: changePercent(thisMonth, lastMonth),
  };
}

function changePercent(thisMonth: number, lastMonth: number): number | null {
  if (lastMonth === 0) {
    return thisMonth === 0 ? null : 100;
  }

  return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
}
