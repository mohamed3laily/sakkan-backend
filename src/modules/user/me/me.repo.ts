import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/modules/db/drizzle.service';
import { users } from 'src/modules/db/schemas/user/user';
import { cities } from 'src/modules/db/schemas/cities/cities';
import { eq } from 'drizzle-orm';
import { UpdateMeDto } from './dto/me.dto';

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
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(cities, eq(users.cityId, cities.id))
      .where(eq(users.id, userId))
      .limit(1);
    return user || null;
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    const [user] = await this.drizzle.db
      .update(users)
      .set(dto)
      .where(eq(users.id, userId))
      .returning({
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
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return user || null;
  }

  async deleteMe(userId: number): Promise<boolean> {
    const result = await this.drizzle.db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    return result.length > 0;
  }
}
