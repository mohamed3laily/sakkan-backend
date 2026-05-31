import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DrizzleService } from 'src/modules/db/drizzle.service';
import { appSettings } from 'src/modules/db/schemas/app/app-settings';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

const SETTINGS_COLUMNS = {
  id: appSettings.id,
  phones: appSettings.phones,
  email: appSettings.email,
  termsAndConditionsEn: appSettings.termsAndConditionsEn,
  termsAndConditionsAr: appSettings.termsAndConditionsAr,
  privacyPolicyEn: appSettings.privacyPolicyEn,
  privacyPolicyAr: appSettings.privacyPolicyAr,
  createdAt: appSettings.createdAt,
  updatedAt: appSettings.updatedAt,
} as const;

@Injectable()
export class AppSettingsRepo {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findOne() {
    const [row] = await this.drizzleService.db
      .select(SETTINGS_COLUMNS)
      .from(appSettings)
      .limit(1);

    return row ?? null;
  }

  async update(dto: UpdateAppSettingsDto) {
    const existing = await this.findOne();
    if (!existing) {
      return null;
    }

    const [updated] = await this.drizzleService.db
      .update(appSettings)
      .set(dto)
      .where(eq(appSettings.id, existing.id))
      .returning(SETTINGS_COLUMNS);

    return updated ?? null;
  }
}
