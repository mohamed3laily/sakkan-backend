import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PreferenceService } from './preference.service';
import { TogglePreferencesDto } from './dto/toggle-preference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferenceController {
  constructor(private readonly preferenceService: PreferenceService) {}

  @Post('toggle')
  async toggle(@CurrentUser() user: AuthenticatedUser, @Body() dto: TogglePreferencesDto) {
    return this.preferenceService.toggle(user.id, dto);
  }
}
