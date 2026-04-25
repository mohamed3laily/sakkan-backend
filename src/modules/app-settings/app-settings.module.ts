import { Module } from '@nestjs/common';

import { AppSettingsController } from './app-settings.controller';
import { AppSettingsRepository } from './app-settings.repo';
import { AppSettingsService } from './app-settings.service';

@Module({
  providers: [AppSettingsRepository, AppSettingsService],
  controllers: [AppSettingsController],
})
export class AppSettingsModule {}
