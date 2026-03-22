import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsRepo } from './listings.repo';
import { DrizzleModule } from 'src/modules/db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [ListingsController],
  providers: [ListingsService, ListingsRepo],
})
export class ListingsModule {}
