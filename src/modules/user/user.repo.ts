import { ConflictException, Injectable } from '@nestjs/common';
import { and, asc, avg, count, eq, ilike, isNull, notInArray, or, sql } from 'drizzle-orm';
import { cities, users } from '../db/schemas/schema-index';
import { DrizzleService } from '../db/drizzle.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { reviews } from '../db/schemas/reviews/reviews';

@Injectable()
export class UserRepo {
  constructor(private drizzleService: DrizzleService) {}

  async getUserById(id: number) {
    return this.drizzleService.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findAgents(search: string | undefined, pagination: PaginationDto) {
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
        })
        .from(users)
        .leftJoin(cities, eq(users.cityId, cities.id))
        .where(whereClause)
        .orderBy(asc(users.firstName))
        .limit(limit)
        .offset(offset),

      this.drizzleService.db.select({ total: count() }).from(users).where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async addReview(userId: number, reviewableId: number, dto: CreateReviewDto) {
    const existing = await this.drizzleService.db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.reviewerId, userId), eq(reviews.reviewableId, reviewableId)))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('REVIEW_ALREADY_EXISTS');
    }

    const [review] = await this.drizzleService.db
      .insert(reviews)
      .values({
        reviewerId: userId,
        reviewableId,
        reviewableType: 'USER',
        serviceType: dto.serviceType,
        rating: dto.rating,
        comment: dto.comment,
      })
      .returning();

    await this.updateUserAvgRating(reviewableId);

    return review;
  }

  async findAgentById(id: number) {
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
        avgRating: users.avgRating,
        reviewsCount: users.reviewsCount,
        createdAt: users.createdAt,
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
      .where(and(eq(users.id, id)))
      .limit(1);

    return user || null;
  }

  private async updateUserAvgRating(userId: number) {
    await this.drizzleService.db
      .update(users)
      .set({
        avgRating: sql<number>`(
        SELECT ROUND(AVG(${reviews.rating}))
        FROM ${reviews}
        WHERE ${reviews.reviewableId} = ${userId}
        AND ${reviews.reviewableType} = 'USER'
      )`,
        reviewsCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${reviews}
        WHERE ${reviews.reviewableId} = ${userId}
        AND ${reviews.reviewableType} = 'USER'
      )`,
      })
      .where(eq(users.id, userId));
  }
}
