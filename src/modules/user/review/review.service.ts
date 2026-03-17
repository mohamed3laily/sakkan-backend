import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepo } from './review.repo';
import { PaginationService } from 'src/common/services/pagination.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    private reviewRepo: ReviewRepo,
    private paginationService: PaginationService,
  ) {}

  async getAgentReviews(agentId: number, pagination: PaginationDto) {
    const exists = await this.reviewRepo.agentExists(agentId);
    if (!exists) throw new NotFoundException('USER_NOT_FOUND');

    const { page = 1, limit = 10 } = pagination;
    const { data, total } = await this.reviewRepo.findAll(agentId, { page, limit });
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async createReview(reviewerId: number, agentId: number, dto: CreateReviewDto) {
    if (reviewerId === agentId) throw new NotFoundException('CANNOT_REVIEW_YOURSELF');

    const exists = await this.reviewRepo.agentExists(agentId);
    if (!exists) throw new NotFoundException('USER_NOT_FOUND');

    return this.reviewRepo.create(reviewerId, agentId, dto);
  }

  async updateReview(reviewerId: number, agentId: number, dto: UpdateReviewDto) {
    const exists = await this.reviewRepo.agentExists(agentId);
    if (!exists) throw new NotFoundException('USER_NOT_FOUND');

    return this.reviewRepo.update(reviewerId, agentId, dto);
  }

  async getMyReview(reviewerId: number, agentId: number) {
    const review = await this.reviewRepo.findMine(reviewerId, agentId);
    if (!review) throw new NotFoundException('REVIEW_NOT_FOUND');
    return review;
  }
}
