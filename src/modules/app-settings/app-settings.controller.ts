import { Controller, Get } from '@nestjs/common';

import { AppSettingsService } from './app-settings.service';

@Controller('app-settings')
export class AppSettingsController {
  constructor(private readonly service: AppSettingsService) {}

  @Get()
  getAppSettings() {
    return this.service.getPublicSettings();
  }
}
