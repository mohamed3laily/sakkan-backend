import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { ListingModule } from './listing/listing.module';
import { MeService } from './me.service';
import { MeRepository } from './me.repo';

@Module({
  imports: [ListingModule],
  controllers: [MeController],
  providers: [MeService, MeRepository],
})
export class MeModule {}
