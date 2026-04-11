import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { ListingModule } from './listing/listing.module';
import { MeService } from './me.service';
import { MeRepository } from './me.repo';
import { PreferenceModule } from 'src/modules/preference/preference.module';
import { StorageModule } from 'src/modules/storage/storage.module';

@Module({
  imports: [ListingModule, PreferenceModule, StorageModule],
  controllers: [MeController],
  providers: [MeService, MeRepository],
})
export class MeModule {}
