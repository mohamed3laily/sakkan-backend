import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { CityController } from './city.controller';
import { CityRepository } from './city.repo';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from 'src/common/queues/queue.constants';
import { CityQueue } from './city.queue';
import { CityProcessor } from './city.processor';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.CITY })],
  providers: [CityService, CityRepository, CityProcessor, CityQueue],
  exports: [CityService, CityQueue, CityProcessor],
  controllers: [CityController],
})
export class CityModule {}
