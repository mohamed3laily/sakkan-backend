import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { CitiesModule } from './cities/cities.module';
import { ListingsModule } from './listings/listings.module';
import { UsersModule } from './users/users.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ListingsModule,
    UsersModule,
    CitiesModule,
    AuthModule,
    StatsModule,
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
        children: [
          { path: 'listings', module: ListingsModule },
          { path: 'users', module: UsersModule },
          { path: 'cities', module: CitiesModule },
          { path: 'auth', module: AuthModule },
        ],
      },
    ]),
  ],
})
export class AdminModule {}
