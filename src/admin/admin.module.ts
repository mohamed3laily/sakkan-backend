import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { AdminsModule } from './admins/admins.module';
import { AppSettingsModule } from './app-settings/app-settings.module';
import { AuthModule } from './auth/auth.module';
import { CitiesModule } from './cities/cities.module';
import { ListingsModule } from './listings/listings.module';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';
import { UserSubscriptionsModule } from './user-subscriptions/user-subscriptions.module';
import { UsersModule } from './users/users.module';
import { StatsModule } from './stats/stats.module';
import { ReportsModule } from './reports/reports.module';
import { RealEstateDevelopersParentModule } from './real-estate-developers/real-estate-developers.module';

@Module({
  imports: [
    AdminsModule,
    AppSettingsModule,
    ListingsModule,
    UsersModule,
    CitiesModule,
    SubscriptionPlansModule,
    UserSubscriptionsModule,
    AuthModule,
    StatsModule,
    ReportsModule,
    RealEstateDevelopersParentModule,
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
        children: [
          { path: 'listings', module: ListingsModule },
          { path: 'users', module: UsersModule },
          { path: 'cities', module: CitiesModule },
          { path: 'subscription-plans', module: SubscriptionPlansModule },
          { path: 'user-subscriptions', module: UserSubscriptionsModule },
          { path: 'app-settings', module: AppSettingsModule },
          { path: 'admins', module: AdminsModule },
          { path: 'stats', module: StatsModule },
          { path: 'reports', module: ReportsModule },
          { path: 'auth', module: AuthModule },
          { path: 'real-estate-developers', module: RealEstateDevelopersParentModule },
        ],
      },
    ]),
  ],
})
export class AdminModule {}
