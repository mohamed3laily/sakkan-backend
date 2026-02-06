import { Module } from '@nestjs/common';
import { ListingService } from './listing.service';
import { ListingController } from './listing.controller';
import { ListingsRepository } from './listing.repo';

@Module({
  providers: [ListingService, ListingsRepository],
  controllers: [ListingController],
})
export class ListingModule {}
