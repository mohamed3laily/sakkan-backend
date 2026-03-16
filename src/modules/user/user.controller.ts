import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserQueryDto } from './dto/user-query.dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('agents/:id')
  async getAgentById(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.getAgentById(userId);
  }

  @Get('agents')
  async getAgents(@Query() query: UserQueryDto) {
    return this.userService.getAgents(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('agents/:id/reviews')
  async createReview(
    @Param('id', ParseIntPipe) userId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.userService.addReview(user.id, userId, dto);
  }
}
