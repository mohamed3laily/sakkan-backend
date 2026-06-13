import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { LogAction } from 'src/common/logging';
import { PaginationService } from 'src/common/services/pagination.service';
import { AdminSessionService } from '../auth/admin-session.service';
import { AdminsRepo } from './admins.repo';
import { AdminQueryDto } from './dto/admin-query.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminsService {
  private static readonly BCRYPT_SALT_ROUNDS = 10;
  private readonly logger = new Logger(AdminsService.name);

  constructor(
    private readonly repo: AdminsRepo,
    private readonly paginationService: PaginationService,
    private readonly adminSessionService: AdminSessionService,
  ) {}

  async getAdmins(query: AdminQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.repo.findAll(query);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getAdminById(id: number) {
    const admin = await this.repo.findById(id);
    if (!admin) {
      throw new NotFoundException('ADMIN_NOT_FOUND');
    }

    return admin;
  }

  async createAdmin(actorId: number, dto: CreateAdminDto) {
    const existing = await this.repo.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictException('PHONE_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(dto.password, AdminsService.BCRYPT_SALT_ROUNDS);
    const admin = await this.repo.create({
      name: dto.name,
      phone: dto.phone,
      password: hashedPassword,
      type: dto.type ?? 'admin',
    });

    this.logger.log(
      { action: LogAction.ADMIN_CREATED, actorId, targetAdminId: admin.id },
      'Super admin created admin',
    );

    return admin;
  }

  async updateAdmin(actorId: number, id: number, dto: UpdateAdminDto) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('ADMIN_NOT_FOUND');
    }

    if (existing.revokedAt) {
      throw new BadRequestException('ADMIN_REVOKED');
    }

    if (dto.phone && dto.phone !== existing.phone) {
      const phoneTaken = await this.repo.findByPhone(dto.phone, id);
      if (phoneTaken) {
        throw new ConflictException('PHONE_EXISTS');
      }
    }

    if (dto.type && dto.type !== existing.type) {
      await this.ensureNotLastSuperAdmin(existing.id, existing.type, dto.type);
    }

    const updated = await this.repo.update(id, dto);
    if (!updated) {
      throw new NotFoundException('ADMIN_NOT_FOUND');
    }

    this.logger.log(
      { action: LogAction.ADMIN_UPDATED, actorId, targetAdminId: id },
      'Super admin updated admin',
    );

    return updated;
  }

  async deleteAdmin(actorId: number, id: number) {
    if (actorId === id) {
      throw new BadRequestException('CANNOT_REVOKE_SELF');
    }

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('ADMIN_NOT_FOUND');
    }

    if (existing.revokedAt) {
      throw new BadRequestException('ADMIN_REVOKED');
    }

    if (existing.type === 'super_admin') {
      const remaining = await this.repo.countActiveSuperAdmins(id);
      if (remaining === 0) {
        throw new BadRequestException('LAST_SUPER_ADMIN');
      }
    }

    const revoked = await this.repo.revoke(id);
    if (!revoked) {
      throw new NotFoundException('ADMIN_NOT_FOUND');
    }

    await this.adminSessionService.revokeAllSessionsForAdmin(id);

    this.logger.log(
      { action: LogAction.ADMIN_REVOKED, actorId, targetAdminId: id },
      'Super admin revoked admin access',
    );

    return { id: revoked.id, deleted: true };
  }

  private async ensureNotLastSuperAdmin(
    adminId: number,
    currentType: 'admin' | 'super_admin',
    nextType: 'admin' | 'super_admin',
  ) {
    if (currentType !== 'super_admin' || nextType === 'super_admin') {
      return;
    }

    const remaining = await this.repo.countActiveSuperAdmins(adminId);
    if (remaining === 0) {
      throw new BadRequestException('LAST_SUPER_ADMIN');
    }
  }
}
