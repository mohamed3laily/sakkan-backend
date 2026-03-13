import { Injectable } from '@nestjs/common';
import { UserRepo } from './user.repo';
import { PaginationService } from 'src/common/services/pagination.service';

@Injectable()
export class UserService {
  constructor(private userRepo: UserRepo) {}

  async getUserById(id: number) {
    return this.userRepo.getUserById(id);
  }
}
