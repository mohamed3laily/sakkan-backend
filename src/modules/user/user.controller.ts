import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserQueryDto } from './dto/user-query.dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Public()
  @Get('agents/:id')
  async getAgentById(
    @Param('id', ParseIntPipe) userId: number,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    return this.userService.getAgentById(userId, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Public()
  @Get('agents')
  async getAgents(@Query() query: UserQueryDto, @CurrentUser() user: AuthenticatedUser | null) {
    return this.userService.getAgents(query, user?.id);
  }
}
