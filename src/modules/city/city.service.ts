import { Injectable, NotFoundException } from '@nestjs/common';
import { CityRepository } from './city.repo';

@Injectable()
export class CityService {
  constructor(private readonly repo: CityRepository) {}

  async getCities(name?: string) {
    return this.repo.findAllCities(name);
  }

  async getAreasByCity(cityId: number, name?: string) {
    return this.repo.findCityAreas(cityId, name);
  }
}
