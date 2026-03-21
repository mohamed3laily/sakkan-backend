import { Injectable } from '@nestjs/common';
import { PreferenceRepo } from './preference.repo';
import { TogglePreferenceDto } from './dto/toggle-preference.dto';

@Injectable()
export class PreferenceService {
  constructor(private readonly repo: PreferenceRepo) {}

  async toggle(userId: number, dto: TogglePreferenceDto) {
    const existing = await this.repo.findExisting(userId, dto.preferableType, dto.preferableId);

    if (existing) {
      await this.repo.delete(existing.id);
      return { isPreferred: false };
    }

    await this.repo.create(userId, dto.preferableType, dto.preferableId);
    return { isPreferred: true };
  }

  async getUserPreferences(userId: number) {
    return this.repo.findUserPreferences(userId);
  }
}
