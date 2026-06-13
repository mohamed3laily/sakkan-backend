import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AuthenticatedAdmin } from '../auth/interfaces/authenticated-admin.interface';
import { AdminsService } from './admins.service';
import { AdminQueryDto } from './dto/admin-query.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@UseGuards(SuperAdminGuard)
@Controller('')
export class AdminsController {
  constructor(private readonly service: AdminsService) {}

  @Get()
  getAdmins(@Query() query: AdminQueryDto) {
    return this.service.getAdmins(query);
  }

  @Get(':id')
  getAdminById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAdminById(id);
  }

  @Post()
  createAdmin(@CurrentAdmin() admin: AuthenticatedAdmin, @Body() dto: CreateAdminDto) {
    return this.service.createAdmin(admin.id, dto);
  }

  @Patch(':id')
  updateAdmin(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.service.updateAdmin(admin.id, id, dto);
  }

  @Delete(':id')
  deleteAdmin(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteAdmin(admin.id, id);
  }
}
