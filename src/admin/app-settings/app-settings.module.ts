import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/modules/db/drizzle.module';
import { AppSettingsController } from './app-settings.controller';
import { AppSettingsRepo } from './app-settings.repo';
import { AppSettingsService } from './app-settings.service';

@Module({
  imports: [DrizzleModule],
  controllers: [AppSettingsController],
  providers: [AppSettingsService, AppSettingsRepo],
})
export class AppSettingsModule {}
