import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { TranslateInterceptor } from 'src/common/interceptors/translate.interceptor';
import { DeveloperProjectsQueryDto } from './dto/developer-projects-query.dto';
import { DevelopersQueryDto } from './dto/developers-query.dto';
import { RealEstateDeveloperService } from './real-estate-developer.service';

@UseGuards(JwtAuthGuard)
@Controller('')
export class RealEstateDeveloperController {
  constructor(private readonly service: RealEstateDeveloperService) {}

  @Public()
  @UseInterceptors(TranslateInterceptor)
  @Get('projects/:projectId')
  async getProjectById(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.getProjectById(projectId);
  }

  @Public()
  @UseInterceptors(TranslateInterceptor)
  @Get('projects')
  async getProjects(@Query() query: DeveloperProjectsQueryDto) {
    return this.service.getProjects(query);
  }

  @Public()
  @UseInterceptors(TranslateInterceptor)
  @Get()
  async getDevelopers(@Query() query: DevelopersQueryDto) {
    return this.service.getDevelopers(query);
  }
}
