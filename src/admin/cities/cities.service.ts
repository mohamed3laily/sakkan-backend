import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { LogAction } from 'src/common/logging';
import { CitiesRepo } from './cities.repo';
import { AdminCityQueryDto } from './dto/city-query.dto';
import { CreateAreaDto } from './dto/create-area.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CitiesService {
  private readonly logger = new Logger(CitiesService.name);

  constructor(private readonly repo: CitiesRepo) {}

  async getCities(query: AdminCityQueryDto) {
    return this.repo.findAll(query);
  }

  async getCityById(id: number) {
    const city = await this.repo.findById(id);
    if (!city) {
      throw new NotFoundException('CITY_NOT_FOUND');
    }

    return city;
  }

  async createCity(adminId: number, dto: CreateCityDto) {
    const existing = await this.repo.findByNameEn(dto.nameEn);
    if (existing) {
      throw new ConflictException('CITY_NAME_EXISTS');
    }

    const city = await this.repo.create(dto);

    this.logger.log(
      ({ action: LogAction.ADMIN_CITY_CREATED, adminId, cityId: city.id }),
      'Admin created city',
    );

    return city;
  }

  async updateCity(adminId: number, id: number, dto: UpdateCityDto) {
    const city = await this.repo.findById(id);
    if (!city) {
      throw new NotFoundException('CITY_NOT_FOUND');
    }

    if (dto.nameEn && dto.nameEn !== city.nameEn) {
      const existing = await this.repo.findByNameEn(dto.nameEn, id);
      if (existing) {
        throw new ConflictException('CITY_NAME_EXISTS');
      }
    }

    const updated = await this.repo.update(id, dto);
    if (!updated) {
      throw new NotFoundException('CITY_NOT_FOUND');
    }

    this.logger.log(
      ({ action: LogAction.ADMIN_CITY_UPDATED, adminId, cityId: id }),
      'Admin updated city',
    );

    return updated;
  }

  async deleteCity(adminId: number, id: number) {
    const city = await this.repo.findById(id);
    if (!city) {
      throw new NotFoundException('CITY_NOT_FOUND');
    }

    const listingCount = await this.repo.countListingsByCityId(id);
    if (listingCount > 0) {
      throw new ConflictException('CITY_HAS_LISTINGS');
    }

    const deleted = await this.repo.delete(id);
    if (!deleted) {
      throw new NotFoundException('CITY_NOT_FOUND');
    }

    this.logger.warn(
      ({ action: LogAction.ADMIN_CITY_DELETED, adminId, cityId: id }),
      'Admin deleted city',
    );

    return { id: deleted.id, deleted: true };
  }

  async getAreas(cityId: number) {
    await this.ensureCityExists(cityId);
    return this.repo.findAreasByCityId(cityId);
  }

  async createArea(adminId: number, cityId: number, dto: CreateAreaDto) {
    await this.ensureCityExists(cityId);

    const area = await this.repo.createArea(cityId, dto);

    this.logger.log(
      ({ action: LogAction.ADMIN_AREA_CREATED, adminId, cityId, areaId: area.id }),
      'Admin created area',
    );

    return area;
  }

  async updateArea(adminId: number, cityId: number, areaId: number, dto: UpdateAreaDto) {
    await this.ensureCityExists(cityId);

    const area = await this.repo.updateArea(cityId, areaId, dto);
    if (!area) {
      throw new NotFoundException('AREA_NOT_FOUND');
    }

    this.logger.log(
      ({ action: LogAction.ADMIN_AREA_UPDATED, adminId, cityId, areaId }),
      'Admin updated area',
    );

    return area;
  }

  async deleteArea(adminId: number, cityId: number, areaId: number) {
    await this.ensureCityExists(cityId);

    const area = await this.repo.findAreaById(cityId, areaId);
    if (!area) {
      throw new NotFoundException('AREA_NOT_FOUND');
    }

    const listingCount = await this.repo.countListingsUsingArea(areaId);
    if (listingCount > 0) {
      throw new ConflictException('AREA_IN_USE');
    }

    const deleted = await this.repo.deleteArea(cityId, areaId);
    if (!deleted) {
      throw new NotFoundException('AREA_NOT_FOUND');
    }

    this.logger.warn(
      ({ action: LogAction.ADMIN_AREA_DELETED, adminId, cityId, areaId }),
      'Admin deleted area',
    );

    return { id: deleted.id, deleted: true };
  }

  private async ensureCityExists(cityId: number) {
    const city = await this.repo.findById(cityId);
    if (!city) {
      throw new NotFoundException('CITY_NOT_FOUND');
    }
  }
}
