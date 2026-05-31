import { Injectable } from '@nestjs/common';
import { InsertUser, users } from '../db/schemas/schema-index';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';

type InsertUserRegistration = Pick<
  InsertUser,
  'firstName' | 'lastName' | 'phone' | 'password' | 'type'
>;

@Injectable()
export class AuthRepo {
  constructor(private drizzleService: DrizzleService) {}

  async getUserByPhone(phone: string) {
    return this.drizzleService.db.query.users.findFirst({
      where: eq(users.phone, phone),
    });
  }

  async getUserById(id: number) {
    return this.drizzleService.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async insertUser(
    userData: InsertUserRegistration,
    verifyPhoneToken?: string,
    verifyPhoneTokenExpiry?: Date,
  ) {
    return this.drizzleService.db
      .insert(users)
      .values({
        ...userData,
        verifyPhoneToken,
        verifyPhoneTokenExpiry,
      })
      .returning();
  }

  async updateUser(userId: number, updateData: Partial<InsertUser>) {
    return this.drizzleService.db.update(users).set(updateData).where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string) {
    return this.drizzleService.db.query.users.findFirst({
      where: eq(users.resetToken, token),
    });
  }

  async deleteUserById(id: number) {
    return this.drizzleService.db.delete(users).where(eq(users.id, id));
  }
}
