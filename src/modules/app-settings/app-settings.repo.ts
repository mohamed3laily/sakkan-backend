import { Injectable } from '@nestjs/common';

import { DrizzleService } from '../db/drizzle.service';
import { appSettings } from '../db/schemas/app/app-settings';

@Injectable()
export class AppSettingsRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getPublicSettings() {
    const [row] = await this.drizzleService.db
      .select({
        phones: appSettings.phones,
        email: appSettings.email,
        termsAndConditions: appSettings.termsAndConditions,
      })
      .from(appSettings)
      .limit(1);
    return row ?? null;
  }
}
