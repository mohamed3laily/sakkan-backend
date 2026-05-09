import { Module } from '@nestjs/common';

import { PropertyController } from './property.controller';
import { PropertyRepository } from './property.repo';
import { PropertyService } from './property.service';

@Module({
  controllers: [PropertyController],
  providers: [PropertyService, PropertyRepository],
})
export class PropertyModule {}
