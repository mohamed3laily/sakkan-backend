import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/modules/db/drizzle.service';
import { users } from 'src/modules/db/schemas/user/user';
import { cities } from 'src/modules/db/schemas/cities/cities';
import { subscriptionPlans, userSubscriptions } from 'src/modules/db/schemas/schema-index';
import { and, eq, sql } from 'drizzle-orm';
import type { SafeUserProfileUpdate, UpdateMeDto } from './dto/me.dto';

const PROFILE_RETURNING = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  phone: users.phone,
  profilePicture: users.profilePicture,
  type: users.type,
  bio: users.bio,
  organizationNameAr: users.organizationNameAr,
  organizationNameEn: users.organizationNameEn,
  socialMediaLinks: users.socialMediaLinks,
  contactViaWhatsapp: users.contactViaWhatsapp,
  contactViaPhone: users.contactViaPhone,
  language: users.language,
  fcmToken: users.fcmToken,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

@Injectable()
export class MeRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async getMe(userId: number) {
    const [user] = await this.drizzle.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        profilePicture: users.profilePicture,
        type: users.type,
        bio: users.bio,
        organizationNameAr: users.organizationNameAr,
        organizationNameEn: users.organizationNameEn,
        socialMediaLinks: users.socialMediaLinks,
        city: {
          id: cities.id,
          nameEn: cities.nameEn,
          nameAr: cities.nameAr,
        },
        contactViaWhatsapp: users.contactViaWhatsapp,
        contactViaPhone: users.contactViaPhone,
        language: users.language,
        fcmToken: users.fcmToken,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        isVerified: sql<boolean>`COALESCE(${subscriptionPlans.hasVerifiedBadge}, false)`,
      })
      .from(users)
      .leftJoin(cities, eq(users.cityId, cities.id))
      .leftJoin(
        userSubscriptions,
        and(
          eq(userSubscriptions.userId, users.id),
          eq(userSubscriptions.status, 'active'),
          sql`${userSubscriptions.periodEnd} > NOW()`,
        ),
      )
      .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, userSubscriptions.planId))
      .where(eq(users.id, userId))
      .limit(1);
    return user || null;
  }

  async findUserIdByPhone(phone: string): Promise<number | null> {
    const [row] = await this.drizzle.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    return row?.id ?? null;
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    const safeUpdate = this.toSafeUpdate(dto);
    if (Object.keys(safeUpdate).length === 0) {
      return this.getMe(userId);
    }

    const [user] = await this.drizzle.db
      .update(users)
      .set(safeUpdate)
      .where(eq(users.id, userId))
      .returning(PROFILE_RETURNING);
    return user || null;
  }

  async updatePhone(userId: number, phone: string, verifiedPhoneAt: Date | null) {
    const [user] = await this.drizzle.db
      .update(users)
      .set({ phone, verifiedPhoneAt })
      .where(eq(users.id, userId))
      .returning(PROFILE_RETURNING);
    return user || null;
  }

  async updateProfilePicture(userId: number, profilePicture: string) {
    const [user] = await this.drizzle.db
      .update(users)
      .set({ profilePicture })
      .where(eq(users.id, userId))
      .returning(PROFILE_RETURNING);
    return user || null;
  }

  async deleteMe(userId: number): Promise<boolean> {
    const result = await this.drizzle.db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    return result.length > 0;
  }

  private toSafeUpdate(dto: UpdateMeDto): SafeUserProfileUpdate {
    const safe: SafeUserProfileUpdate = {};

    if (dto.firstName !== undefined) safe.firstName = dto.firstName;
    if (dto.lastName !== undefined) safe.lastName = dto.lastName;
    if (dto.bio !== undefined) safe.bio = dto.bio;
    if (dto.organizationNameAr !== undefined) safe.organizationNameAr = dto.organizationNameAr;
    if (dto.organizationNameEn !== undefined) safe.organizationNameEn = dto.organizationNameEn;
    if (dto.socialMediaLinks !== undefined) safe.socialMediaLinks = dto.socialMediaLinks;
    if (dto.cityId !== undefined) safe.cityId = dto.cityId;
    if (dto.contactViaWhatsapp !== undefined) safe.contactViaWhatsapp = dto.contactViaWhatsapp;
    if (dto.contactViaPhone !== undefined) safe.contactViaPhone = dto.contactViaPhone;
    if (dto.language !== undefined) safe.language = dto.language;
    if (dto.fcmToken !== undefined) safe.fcmToken = dto.fcmToken;

    return safe;
  }
}
