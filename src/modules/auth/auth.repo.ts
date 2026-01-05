import { Injectable } from '@nestjs/common';
import { InsertUser, users } from '../db/schemas/schema-index';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthRepo {
  constructor(private drizzleService: DrizzleService) {}

  async getUserByPhone(phone: string) {
    return this.drizzleService.db.query.users.findFirst({
      where: eq(users.phone, phone),
    });
  }

  async insertUser(userData: RegisterDto) {
    return this.drizzleService.db.insert(users).values(userData).returning();
  }

  async updateUser(userId: number, updateData: Partial<InsertUser>) {
    return this.drizzleService.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string) {
    return this.drizzleService.db.query.users.findFirst({
      where: eq(users.resetToken, token),
    });
  }
}
