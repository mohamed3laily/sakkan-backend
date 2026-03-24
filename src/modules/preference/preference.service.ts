import { Injectable } from '@nestjs/common';
import { PreferenceRepo } from './preference.repo';
import { TogglePreferencesDto } from './dto/toggle-preference.dto';

@Injectable()
export class PreferenceService {
  constructor(private readonly repo: PreferenceRepo) {}

  async toggle(userId: number, dto: TogglePreferencesDto) {
    const { preferableType, preferableIds } = dto;

    const existing = await this.repo.findExistingBatch(userId, preferableType, preferableIds);

    const existingIdSet = new Set(existing.map((e) => e.preferableId));
    const toDelete = existing.map((e) => e.id);
    const toCreate = preferableIds.filter((id) => !existingIdSet.has(id));

    await Promise.all([
      toDelete.length && this.repo.deleteBatch(toDelete),
      toCreate.length && this.repo.createBatch(userId, preferableType, toCreate),
    ]);

    return preferableIds.map((id) => ({
      preferableId: id,
      preferableType,
      isPreferred: !existingIdSet.has(id),
    }));
  }

  async getUserPreferences(userId: number) {
    return this.repo.findUserPreferences(userId);
  }
}
