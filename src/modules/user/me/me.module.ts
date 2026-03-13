import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { ListingModule } from './listing/listing.module';

@Module({
  imports: [ListingModule],
  controllers: [MeController],
})
export class MeModule {}
