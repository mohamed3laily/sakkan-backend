import { Controller, Get, Query, Param, ParseIntPipe, Delete, Patch } from '@nestjs/common';

import { UsersService } from './users.service';
import { AdminUserQueryDto } from './dto/user-query.dto';

@Controller('admin/users')
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
  async toggleDeactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleDeactivate(id);
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteUser(id);
  }
}
