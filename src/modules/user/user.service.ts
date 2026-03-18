import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepo } from './user.repo';
import { PaginationService } from 'src/common/services/pagination.service';
import { UserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepo,
    private paginationService: PaginationService,
  ) {}

  async getUserById(id: number) {
    return this.userRepo.getUserById(id);
  }

  async getAgents(query: UserQueryDto, currentUserId?: number) {
    const { page = 1, limit = 10, search } = query;

    const { data, total } = await this.userRepo.findAgents(search, { page, limit }, currentUserId);

    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getAgentById(id: number, currentUserId?: number) {
    const user = await this.userRepo.findAgentById(id, currentUserId);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return user;
  }
}
