import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { PropertyModule } from './property/property.module';
import { RealEstateDeveloperController } from './real-estate-developer.controller';
import { RealEstateDeveloperRepository } from './real-estate-developer.repo';
import { RealEstateDeveloperService } from './real-estate-developer.service';

@Module({
  controllers: [RealEstateDeveloperController],
  providers: [RealEstateDeveloperService, RealEstateDeveloperRepository],
  imports: [
    PropertyModule,
    RouterModule.register([
      {
        path: 'real-estate-developers',
        module: RealEstateDeveloperModule,
        children: [{ path: 'projects', module: PropertyModule }],
      },
    ]),
  ],
})
export class RealEstateDeveloperModule {}
