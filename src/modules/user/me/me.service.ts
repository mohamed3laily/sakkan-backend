import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MeRepository } from './me.repo';
import { UpdateMeDto } from './dto/me.dto';

@Injectable()
export class MeService {
  constructor(private readonly meRepo: MeRepository) {}

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
}
