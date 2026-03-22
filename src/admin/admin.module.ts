import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';

@Module({
  imports: [AuthModule, ListingsModule],
})
export class AdminModule {}
