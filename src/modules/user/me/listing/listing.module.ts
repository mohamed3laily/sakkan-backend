import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { ListingRepository } from './listing.repository';

@Module({
  controllers: [ListingController],
  providers: [ListingService, ListingRepository],
})
export class ListingModule {}
