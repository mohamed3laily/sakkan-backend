import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepo } from './users.repo';
import { AdminUserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepo) {}

  async getUsers(query: AdminUserQueryDto) {
    return this.repo.findAll(query);
  }

  async getUserById(id: number) {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async toggleDeactivate(id: number) {
    const result = await this.repo.toggleDeactivate(id);
    if (!result) throw new NotFoundException(`User ${id} not found`);

    return {
      id: result.id,
      active: result.deactivatedAt === null,
      deactivatedAt: result.deactivatedAt,
    };
  }

  async deleteUser(id: number) {
    const result = await this.repo.delete(id);
    if (!result) throw new NotFoundException(`User ${id} not found`);

    return { id: result.id, deleted: true };
  }
}
