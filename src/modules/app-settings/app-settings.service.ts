import { Injectable, NotFoundException } from '@nestjs/common';

import { AppSettingsRepository } from './app-settings.repo';

@Injectable()
export class AppSettingsService {
  constructor(private readonly repo: AppSettingsRepository) {}

  async getPublicSettings() {
    const row = await this.repo.getPublicSettings();
    if (!row) {
      throw new NotFoundException('NOT_FOUND');
    }
    return row;
  }
}
