import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { UsersModule } from './users/users.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [AuthModule, ListingsModule, UsersModule, StatsModule],
})
export class AdminModule {}
