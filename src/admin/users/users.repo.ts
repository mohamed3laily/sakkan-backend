import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/modules/db/drizzle.service';
import { users } from 'src/modules/db/schemas/user/user';
import { eq, ilike, count, and, or, sql } from 'drizzle-orm';
import { AdminUserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UsersRepo {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findAll(query: AdminUserQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const offset = (page - 1) * limit;
    const whereClause = search ? this.buildSearchWhere(search) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db.select().from(users).where(whereClause).limit(limit).offset(offset),
      this.drizzleService.db.select({ total: count() }).from(users).where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async findById(id: number) {
    const [user] = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user || null;
  }

  async toggleDeactivate(id: number) {
    const [updated] = await this.drizzleService.db
      .update(users)
      .set({
        deactivatedAt: sql`CASE WHEN ${users.deactivatedAt} IS NULL THEN NOW() ELSE NULL END`,
      })
      .where(eq(users.id, id))
      .returning({ id: users.id, deactivatedAt: users.deactivatedAt });

    return updated ?? null;
  }

  async delete(id: number) {
    const [deleted] = await this.drizzleService.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return deleted ?? null;
  }

  private buildSearchWhere(search: string) {
    const isPhone = /^[+\d\s\-()]{3,}$/.test(search.trim());

    if (isPhone) {
      return eq(users.phone, search.trim());
    }

    return or(
      ilike(users.firstName, `%${search}%`),
      ilike(users.lastName, `%${search}%`),
      sql`${users.firstName} || ' ' || ${users.lastName} ilike ${`%${search}%`}`,
    );
  }
}
