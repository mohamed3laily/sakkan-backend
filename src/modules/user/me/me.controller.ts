import {
  Controller,
  Get,
  Body,
  UseGuards,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';

import { MeService } from './me.service';
import { ChangePhoneDto, UpdateMeDto } from './dto/me.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AllowUnverified } from 'src/modules/auth/decorators/allow-unverified.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/interfaces/authenticated-user.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageUploadInterceptorOptions } from 'src/modules/storage/upload.config';

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

  @Put('phone')
  async changePhone(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePhoneDto) {
    return this.meService.changePhone(user.id, dto);
  }

  @Put('profile-picture')
  @UseInterceptors(FileInterceptor('file', imageUploadInterceptorOptions))
  async updateProfilePicture(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.meService.updateProfilePicture(user.id, file);
  }

  @Delete()
  async deleteMe(@CurrentUser() user: AuthenticatedUser) {
    await this.meService.deleteMe(user.id);
    return { message: 'ACCOUNT_DELETED' };
  }

  @Get('preferences')
  async getMyPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.getMyPreferences(user.id);
  }
}
