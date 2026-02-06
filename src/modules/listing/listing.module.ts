import { Module } from '@nestjs/common';
import { ListingService } from './listing.service';
import { ListingController } from './listing.controller';

@Module({
  providers: [ListingService],
  controllers: [ListingController]
})
export class ListingModule {}
