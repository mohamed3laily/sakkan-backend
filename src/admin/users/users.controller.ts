import { Controller, Get, Query, Param, ParseIntPipe, Delete, Patch, UseGuards } from '@nestjs/common';

import { UsersService } from './users.service';
import { AdminUserQueryDto } from './dto/user-query.dto';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AuthenticatedAdmin } from '../auth/interfaces/authenticated-admin.interface';

@UseGuards(AdminJwtAuthGuard)
@Controller('')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  async getUsers(@Query() query: AdminUserQueryDto) {
    return this.service.getUsers(query);
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getUserById(id);
  }

  @Patch(':id/deactivate')
  async toggleDeactivate(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.toggleDeactivate(admin.id, id);
  }

  @Delete(':id')
  async deleteUser(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteUser(admin.id, id);
  }
}
