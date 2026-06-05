import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { SkipTranslation } from 'src/common/decorators/skip-translation.decorator';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AuthenticatedAdmin } from '../auth/interfaces/authenticated-admin.interface';
import { AppSettingsService } from './app-settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

@SkipTranslation()
@UseGuards(AdminJwtAuthGuard)
@Controller('')
export class AppSettingsController {
  constructor(private readonly service: AppSettingsService) {}

  @Get()
  async getSettings() {
    return this.service.getSettings();
  }

  @Patch()
  async updateSettings(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: UpdateAppSettingsDto,
  ) {
    return this.service.updateSettings(admin.id, dto);
  }
}
