import { BadRequestException, Injectable } from '@nestjs/common';
import { MeRepository } from './me.repo';
import { UpdateMeDto } from './dto/me.dto';
import { PreferenceService } from 'src/modules/preference/preference.service';

@Injectable()
export class MeService {
  constructor(
    private readonly meRepo: MeRepository,
    private readonly preferenceService: PreferenceService,
  ) {}

  async getMe(userId: number) {
    return this.meRepo.getMe(userId);
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    return this.meRepo.updateMe(userId, dto);
  }

  async deleteMe(userId: number): Promise<void> {
    const deleted = await this.meRepo.deleteMe(userId);
    if (!deleted) throw new BadRequestException();
  }

  async getMyPreferences(userId: number) {
    return this.preferenceService.getUserPreferences(userId);
  }
}
