import { and, eq, sql } from 'drizzle-orm';

import { userSubscriptions } from 'src/modules/db/schemas/monetization/user-subscriptions';

export const ACTIVE_SUBSCRIPTION_CONDITION = and(
  eq(userSubscriptions.status, 'active'),
  sql`${userSubscriptions.periodEnd} > NOW()`,
);
