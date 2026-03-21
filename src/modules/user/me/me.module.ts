import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { ListingModule } from './listing/listing.module';
import { MeService } from './me.service';
import { MeRepository } from './me.repo';
import { PreferenceModule } from 'src/modules/preference/preference.module';

@Module({
  imports: [ListingModule, PreferenceModule],
  controllers: [MeController],
  providers: [MeService, MeRepository],
})
export class MeModule {}
