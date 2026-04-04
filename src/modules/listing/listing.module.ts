import { Module } from '@nestjs/common';
import { ListingService } from './listing.service';
import { ListingController } from './listing.controller';
import { ListingsRepository } from './listing.repo';
import { CityModule } from '../city/city.module';
import { GeoValidationService } from './geo-validation.service';

@Module({
  imports: [CityModule],
  providers: [ListingService, ListingsRepository, GeoValidationService],
  controllers: [ListingController],
})
export class ListingModule {}
