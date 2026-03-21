import { Module } from '@nestjs/common';
import { PreferenceController } from './preference.controller';
import { PreferenceService } from './preference.service';
import { PreferenceRepo } from './preference.repo';

@Module({
  controllers: [PreferenceController],
  providers: [PreferenceService, PreferenceRepo],
  exports: [PreferenceService],
})
export class PreferenceModule {}
