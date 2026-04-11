import { BadRequestException, Injectable } from '@nestjs/common';
import { MeRepository } from './me.repo';
import { UpdateMeDto } from './dto/me.dto';
import { PreferenceService } from 'src/modules/preference/preference.service';
import { S3Service } from 'src/modules/storage/s3.service';

@Injectable()
export class MeService {
  constructor(
    private readonly meRepo: MeRepository,
    private readonly preferenceService: PreferenceService,
    private readonly s3: S3Service,
  ) {}

  async getMe(userId: number) {
    return this.meRepo.getMe(userId);
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    return this.meRepo.updateMe(userId, dto);
  }

  async updateProfilePicture(userId: number, file: Express.Multer.File) {
    const current = await this.meRepo.getMe(userId);

    const imageInfo = await this.s3.upload('profile-pictures', file);

    const user = await this.meRepo.updateMe(userId, { profilePicture: imageInfo.url });

    if (current?.profilePicture) {
      await this.s3.delete(current.profilePicture);
    }

    return user;
  }

  async deleteMe(userId: number): Promise<void> {
    const deleted = await this.meRepo.deleteMe(userId);
    if (!deleted) throw new BadRequestException();
  }

  async getMyPreferences(userId: number) {
    return this.preferenceService.getUserPreferences(userId);
  }
}
