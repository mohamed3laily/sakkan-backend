import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthenticatedUser } from 'src/modules/auth/interfaces/authenticated-user.interface';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller(':agentId/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async getAgentReviews(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Query() pagination: PaginationDto,
  ) {
    return this.reviewService.getAgentReviews(agentId, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(
    @Param('agentId', ParseIntPipe) agentId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.createReview(user.id, agentId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyReview(
    @Param('agentId', ParseIntPipe) agentId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewService.getMyReview(user.id, agentId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateReview(
    @Param('agentId', ParseIntPipe) agentId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewService.updateReview(user.id, agentId, dto);
  }
}
