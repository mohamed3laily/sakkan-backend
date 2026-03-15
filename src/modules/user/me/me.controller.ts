import {
  Controller,
  Get,
  Body,
  UseGuards,
  Put,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';

import { MeService } from './me.service';
import { UpdateMeDto } from './dto/me.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/interfaces/authenticated-user.interface';

@Controller('')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const userId = user?.id;
    return this.meService.getMe(userId);
  }

  @Put()
  async updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto) {
    const userId = user?.id;
    return this.meService.updateMe(userId, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.deleteMe(user.id);
  }
}
