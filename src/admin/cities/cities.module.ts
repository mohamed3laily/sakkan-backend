import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/modules/db/drizzle.module';
import { CitiesController } from './cities.controller';
import { CitiesRepo } from './cities.repo';
import { CitiesService } from './cities.service';

@Module({
  imports: [DrizzleModule],
  controllers: [CitiesController],
  providers: [CitiesService, CitiesRepo],
})
export class CitiesModule {}
