import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MeRepository } from './me.repo';
import { ChangePhoneDto, UpdateMeDto } from './dto/me.dto';
import { PhoneUtils } from 'src/modules/auth/utils/phone.utils';
import { PreferenceService } from 'src/modules/preference/preference.service';
import { S3Service } from 'src/modules/storage/s3.service';
import { LogAction } from 'src/common/logging';

@Injectable()
export class MeService {
  private readonly logger = new Logger(MeService.name);

  constructor(
    private readonly meRepo: MeRepository,
    private readonly preferenceService: PreferenceService,
    private readonly s3: S3Service,
  ) {}

  async getMe(userId: number) {
    return this.meRepo.getMe(userId);
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    await this.meRepo.updateMe(userId, dto);
    const profile = await this.meRepo.getMe(userId);

    this.logger.log(
      { action: LogAction.USER_PROFILE_UPDATED, userId },
      'User profile updated',
    );

    return profile;
  }

  async changePhone(userId: number, dto: ChangePhoneDto) {
    let normalized: string;
    try {
      normalized = PhoneUtils.normalizePhone(dto.phone);
    } catch {
      throw new BadRequestException('PHONE_WRONG');
    }

    const current = await this.meRepo.getMe(userId);
    if (current.phone === normalized) {
      return current;
    }

    const otherId = await this.meRepo.findUserIdByPhone(normalized);
    if (otherId != null) {
      throw new ConflictException('PHONE_EXISTS');
    }

    const updated = await this.meRepo.updatePhone(userId, normalized, null);
    if (!updated) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    this.logger.log(
      { action: LogAction.USER_PHONE_CHANGED, userId },
      'User phone changed',
    );

    return this.meRepo.getMe(userId);
  }

  async updateProfilePicture(userId: number, file: Express.Multer.File) {
    const current = await this.meRepo.getMe(userId);

    const imageInfo = await this.s3.upload('profile-pictures', file);

    const user = await this.meRepo.updateProfilePicture(userId, imageInfo.url);

    if (current?.profilePicture) {
      await this.s3.delete(current.profilePicture);
    }

    this.logger.log(
      { action: LogAction.USER_PROFILE_PICTURE_UPDATED, userId },
      'User profile picture updated',
    );

    return user;
  }

  async deleteMe(userId: number): Promise<void> {
    const deleted = await this.meRepo.deleteMe(userId);
    if (!deleted) throw new BadRequestException();

    this.logger.warn(
      { action: LogAction.USER_ACCOUNT_DELETED, userId },
      'User account deleted',
    );
  }

  async getMyPreferences(userId: number) {
    return this.preferenceService.getUserPreferences(userId);
  }
}
