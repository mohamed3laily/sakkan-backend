import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { users } from 'src/modules/db/schemas/schema-index';
import { DrizzleService } from 'src/modules/db/drizzle.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { reviews } from 'src/modules/db/schemas/reviews/reviews';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewRepo {
  constructor(private drizzleService: DrizzleService) {}

  async agentExists(id: number): Promise<boolean> {
    const [row] = await this.drizzleService.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return !!row;
  }

  async findAll(agentId: number, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const whereClause = and(eq(reviews.reviewableId, agentId), eq(reviews.reviewableType, 'USER'));

    const reviewer = alias(users, 'reviewer');

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          serviceType: reviews.serviceType,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          reviewer: {
            id: reviewer.id,
            firstName: reviewer.firstName,
            lastName: reviewer.lastName,
            profilePicture: reviewer.profilePicture,
          },
        })
        .from(reviews)
        .innerJoin(reviewer, eq(reviewer.id, reviews.reviewerId))
        .where(whereClause)
        .orderBy(reviews.createdAt)
        .limit(limit)
        .offset(offset),

      this.drizzleService.db.select({ total: count() }).from(reviews).where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async create(reviewerId: number, agentId: number, dto: CreateReviewDto) {
    const existing = await this.drizzleService.db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.reviewerId, reviewerId), eq(reviews.reviewableId, agentId)))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('REVIEW_ALREADY_EXISTS');
    }

    const [review] = await this.drizzleService.db
      .insert(reviews)
      .values({
        reviewerId,
        reviewableId: agentId,
        reviewableType: 'USER',
        serviceType: dto.serviceType,
        rating: dto.rating,
        comment: dto.comment,
      })
      .returning();

    const { avgRating, reviewsCount } = await this.updateAgentAvgRating(agentId);

    return { ...review, newAgentRating: { avgRating, reviewsCount } };
  }

  async update(reviewerId: number, agentId: number, dto: UpdateReviewDto) {
    const [existing] = await this.drizzleService.db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.reviewerId, reviewerId), eq(reviews.reviewableId, agentId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('REVIEW_NOT_FOUND');
    }

    const [updated] = await this.drizzleService.db
      .update(reviews)
      .set(dto)
      .where(eq(reviews.id, existing.id))
      .returning();

    const { avgRating, reviewsCount } = await this.updateAgentAvgRating(agentId);

    return { ...updated, newAgentRating: { avgRating, reviewsCount } };
  }

  async findMine(reviewerId: number, agentId: number) {
    const [review] = await this.drizzleService.db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.reviewerId, reviewerId),
          eq(reviews.reviewableId, agentId),
          eq(reviews.reviewableType, 'USER'),
        ),
      )
      .limit(1);

    return review ?? null;
  }

  private async updateAgentAvgRating(agentId: number) {
    const [updated] = await this.drizzleService.db
      .update(users)
      .set({
        avgRating: sql<number>`(
          SELECT AVG(${reviews.rating})
          FROM ${reviews}
          WHERE ${reviews.reviewableId} = ${agentId}
          AND ${reviews.reviewableType} = 'USER'
        )`,
        reviewsCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${reviews}
          WHERE ${reviews.reviewableId} = ${agentId}
          AND ${reviews.reviewableType} = 'USER'
        )`,
      })
      .where(eq(users.id, agentId))
      .returning({ avgRating: users.avgRating, reviewsCount: users.reviewsCount });

    return updated;
  }
}
