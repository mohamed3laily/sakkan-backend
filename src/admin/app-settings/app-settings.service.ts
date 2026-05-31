import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { LogAction } from 'src/common/logging';
import { AppSettingsRepo } from './app-settings.repo';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

@Injectable()
export class AppSettingsService {
  private readonly logger = new Logger(AppSettingsService.name);

  constructor(private readonly repo: AppSettingsRepo) {}

  async getSettings() {
    const settings = await this.repo.findOne();
    if (!settings) {
      throw new NotFoundException('NOT_FOUND');
    }

    return settings;
  }

  async updateSettings(adminId: number, dto: UpdateAppSettingsDto) {
    const updated = await this.repo.update(dto);
    if (!updated) {
      throw new NotFoundException('NOT_FOUND');
    }

    this.logger.log(
      ({ action: LogAction.ADMIN_APP_SETTINGS_UPDATED, adminId, settingsId: updated.id }),
      'Admin updated app settings',
    );

    return updated;
  }
}
