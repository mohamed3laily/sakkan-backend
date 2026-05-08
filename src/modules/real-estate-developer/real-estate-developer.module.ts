import { Module } from '@nestjs/common';
import { RealEstateDeveloperController } from './real-estate-developer.controller';
import { RealEstateDeveloperRepository } from './real-estate-developer.repo';
import { RealEstateDeveloperService } from './real-estate-developer.service';

@Module({
  controllers: [RealEstateDeveloperController],
  providers: [RealEstateDeveloperService, RealEstateDeveloperRepository],
})
export class RealEstateDeveloperModule {}
