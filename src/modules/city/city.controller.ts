import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CityService } from './city.service';
import { TranslateInterceptor } from 'src/common/interceptors/translate.interceptor';
import { GetAreasDto } from './dto/get-areas.dto';
import { GetCitiesDto } from './dto/get-cities.dto';

@UseInterceptors(TranslateInterceptor)
@Controller('cities')
export class CityController {
  constructor(private readonly service: CityService) {}

  @Get()
  async getCities(@Query() query: GetCitiesDto) {
    return this.service.getCities(query.name);
  }

  @Get(':id/areas')
  async getAreas(
    @Param('id', ParseIntPipe) cityId: number,
    @Query() query: GetAreasDto,
  ) {
    return this.service.getAreasByCity(cityId, query.name);
  }
}
