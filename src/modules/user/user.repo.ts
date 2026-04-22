import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, ilike, notInArray, or, sql } from 'drizzle-orm';
import { cities, subscriptionPlans, userSubscriptions, users } from '../db/schemas/schema-index';
import { DrizzleService } from '../db/drizzle.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { reviews } from '../db/schemas/reviews/reviews';

@Injectable()
export class UserRepo {
  constructor(private drizzleService: DrizzleService) {}

  async getUserById(id: number) {
    return this.drizzleService.db.query.users.findFirst({
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        profilePicture: true,
        type: true,
        bio: true,
        organizationNameAr: true,
        organizationNameEn: true,
        socialMediaLinks: true,
        contactViaWhatsapp: true,
        contactViaPhone: true,
        cityId: true,
        createdAt: true,
        verifiedPhoneAt: true,
      },
      where: eq(users.id, id),
    });
  }

  async findAgents(search: string | undefined, pagination: PaginationDto, currentUserId?: number) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const whereClause = and(
      notInArray(users.type, ['SEEKER']),
      search
        ? or(ilike(users.firstName, `%${search}%`), ilike(users.lastName, `%${search}%`))
        : undefined,
    );

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
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
          contactViaWhatsapp: users.contactViaWhatsapp,
          contactViaPhone: users.contactViaPhone,
          city: {
            id: cities.id,
            nameAr: cities.nameAr,
            nameEn: cities.nameEn,
          },
          createdAt: users.createdAt,
          hasReviewed: this.hasReviewedExpr(currentUserId),
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
        .where(whereClause)
        .orderBy(asc(users.firstName))
        .limit(limit)
        .offset(offset),

      this.drizzleService.db.select({ total: count() }).from(users).where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async findAgentById(id: number, currentUserId?: number) {
    const [user] = await this.drizzleService.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profilePicture: users.profilePicture,
        type: users.type,
        bio: users.bio,
        organizationNameAr: users.organizationNameAr,
        organizationNameEn: users.organizationNameEn,
        socialMediaLinks: users.socialMediaLinks,
        city: {
          id: cities.id,
          nameAr: cities.nameAr,
          nameEn: cities.nameEn,
        },
        contactViaWhatsapp: users.contactViaWhatsapp,
        contactViaPhone: users.contactViaPhone,
        phone: users.phone,
        avgRating: users.avgRating,
        reviewsCount: users.reviewsCount,
        createdAt: users.createdAt,
        hasReviewed: this.hasReviewedExpr(currentUserId),
        isVerified: sql<boolean>`COALESCE(${subscriptionPlans.hasVerifiedBadge}, false)`,
        recentReviewers: sql<
          { id: number; firstName: string; lastName: string; profilePicture: string | null }[]
        >`(
          SELECT COALESCE(json_agg(row_to_json(u)), '[]'::json)
          FROM (
            SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.profile_picture AS "profilePicture"
            FROM ${reviews} r
            JOIN ${users} u ON u.id = r.reviewer_id
            WHERE r.reviewable_id = ${id}
              AND r.reviewable_type = 'USER'
            ORDER BY r.created_at DESC
            LIMIT 5
          ) u
        )`,
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
      .where(and(eq(users.id, id)))
      .limit(1);

    return user || null;
  }

  private hasReviewedExpr(currentUserId?: number) {
    if (!currentUserId) return sql<boolean>`false`;
    return sql<boolean>`EXISTS (
      SELECT 1 FROM ${reviews} r
      WHERE r.reviewer_id = ${currentUserId}
        AND r.reviewable_id = ${users.id}
        AND r.reviewable_type = 'USER'
    )`;
  }
}
