import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { TranslateInterceptor } from 'src/common/interceptors/translate.interceptor';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { ProjectPropertiesQueryDto } from './dto/project-properties-query.dto';
import { PropertyService } from './property.service';

@UseGuards(JwtAuthGuard)
@Controller('')
export class PropertyController {
  constructor(private readonly service: PropertyService) {}

  @Public()
  @UseInterceptors(TranslateInterceptor)
  @Get(':projectId/properties/:propertyId')
  async getProjectPropertyById(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.service.getProjectPropertyById(projectId, propertyId, user?.id);
  }

  @Public()
  @UseInterceptors(TranslateInterceptor)
  @Get(':projectId/properties')
  async getProjectProperties(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() query: ProjectPropertiesQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.service.getProjectProperties(projectId, query, user?.id);
  }
}
