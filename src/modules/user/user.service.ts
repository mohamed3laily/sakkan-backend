import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepo } from './user.repo';
import { PaginationService } from 'src/common/services/pagination.service';
import { UserQueryDto } from './dto/user-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepo,
    private paginationService: PaginationService,
  ) {}

  async getUserById(id: number) {
    return this.userRepo.getUserById(id);
  }

  async getAgents(query: UserQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const { data, total } = await this.userRepo.findAgents(search, { page, limit });

    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getAgentById(id: number) {
    const user = await this.userRepo.findAgentById(id);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return user;
  }

  async addReview(userId: number, reviewableId: number, dto: CreateReviewDto) {
    if (userId === reviewableId) {
      throw new NotFoundException('CANNOT_REVIEW_YOURSELF');
    }

    const user = await this.userRepo.getUserById(reviewableId);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    return this.userRepo.addReview(userId, reviewableId, dto);
  }
}
