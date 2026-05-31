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

import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AuthenticatedAdmin } from '../auth/interfaces/authenticated-admin.interface';
import { CitiesService } from './cities.service';
import { AdminCityQueryDto } from './dto/city-query.dto';
import { CreateAreaDto } from './dto/create-area.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@UseGuards(AdminJwtAuthGuard)
@Controller('')
export class CitiesController {
  constructor(private readonly service: CitiesService) {}

  @Get()
  async getCities(@Query() query: AdminCityQueryDto) {
    return this.service.getCities(query);
  }

  @Post()
  async createCity(@CurrentAdmin() admin: AuthenticatedAdmin, @Body() dto: CreateCityDto) {
    return this.service.createCity(admin.id, dto);
  }

  @Get(':cityId/areas')
  async getAreas(@Param('cityId', ParseIntPipe) cityId: number) {
    return this.service.getAreas(cityId);
  }

  @Post(':cityId/areas')
  async createArea(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('cityId', ParseIntPipe) cityId: number,
    @Body() dto: CreateAreaDto,
  ) {
    return this.service.createArea(admin.id, cityId, dto);
  }

  @Patch(':cityId/areas/:areaId')
  async updateArea(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('cityId', ParseIntPipe) cityId: number,
    @Param('areaId', ParseIntPipe) areaId: number,
    @Body() dto: UpdateAreaDto,
  ) {
    return this.service.updateArea(admin.id, cityId, areaId, dto);
  }

  @Delete(':cityId/areas/:areaId')
  async deleteArea(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('cityId', ParseIntPipe) cityId: number,
    @Param('areaId', ParseIntPipe) areaId: number,
  ) {
    return this.service.deleteArea(admin.id, cityId, areaId);
  }

  @Get(':id')
  async getCityById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getCityById(id);
  }

  @Patch(':id')
  async updateCity(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCityDto,
  ) {
    return this.service.updateCity(admin.id, id, dto);
  }

  @Delete(':id')
  async deleteCity(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteCity(admin.id, id);
  }
}
