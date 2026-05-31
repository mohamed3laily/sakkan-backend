import { Injectable } from '@nestjs/common';
import { and, count, eq, ilike, isNull, ne, or, sql } from 'drizzle-orm';

import { DrizzleService } from 'src/modules/db/drizzle.service';
import { admins } from 'src/modules/db/schemas/admins/admins';
import { AdminQueryDto } from './dto/admin-query.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

const ADMIN_COLUMNS = {
  id: admins.id,
  name: admins.name,
  phone: admins.phone,
  type: admins.type,
  revokedAt: admins.revokedAt,
  createdAt: admins.createdAt,
  updatedAt: admins.updatedAt,
} as const;

@Injectable()
export class AdminsRepo {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findAll(query: AdminQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const offset = (page - 1) * limit;
    const whereClause = search ? this.buildSearchWhere(search) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select(ADMIN_COLUMNS)
        .from(admins)
        .where(whereClause)
        .orderBy(sql`${admins.createdAt} DESC`)
        .limit(limit)
        .offset(offset),
      this.drizzleService.db.select({ total: count() }).from(admins).where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async findById(id: number) {
    const [row] = await this.drizzleService.db
      .select(ADMIN_COLUMNS)
      .from(admins)
      .where(eq(admins.id, id))
      .limit(1);

    return row ?? null;
  }

  async findByPhone(phone: string, excludeId?: number) {
    const conditions = [eq(admins.phone, phone)];
    if (excludeId !== undefined) {
      conditions.push(ne(admins.id, excludeId));
    }

    const [row] = await this.drizzleService.db
      .select({ id: admins.id })
      .from(admins)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  async countActiveSuperAdmins(excludeId?: number) {
    const conditions = [eq(admins.type, 'super_admin'), isNull(admins.revokedAt)];
    if (excludeId !== undefined) {
      conditions.push(ne(admins.id, excludeId));
    }

    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(admins)
      .where(and(...conditions));

    return Number(total);
  }

  async create(values: { name: string; phone: string; password: string; type: 'admin' | 'super_admin' }) {
    const [created] = await this.drizzleService.db
      .insert(admins)
      .values(values)
      .returning(ADMIN_COLUMNS);

    return created;
  }

  async update(id: number, dto: UpdateAdminDto) {
    const [updated] = await this.drizzleService.db
      .update(admins)
      .set(dto)
      .where(eq(admins.id, id))
      .returning(ADMIN_COLUMNS);

    return updated ?? null;
  }

  async revoke(id: number) {
    const now = new Date().toISOString();
    const [updated] = await this.drizzleService.db
      .update(admins)
      .set({ revokedAt: now, updatedAt: now })
      .where(eq(admins.id, id))
      .returning(ADMIN_COLUMNS);

    return updated ?? null;
  }

  private buildSearchWhere(search: string) {
    const pattern = `%${search}%`;
    return or(ilike(admins.name, pattern), ilike(admins.phone, pattern));
  }
}
