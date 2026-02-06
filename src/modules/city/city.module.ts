import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { CityController } from './city.controller';
import { CityRepository } from './city.repo';

@Module({
  providers: [CityService, CityRepository],
  controllers: [CityController],
})
export class CityModule {}
