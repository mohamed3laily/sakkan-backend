import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewRepo } from './review.repo';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepo],
})
export class ReviewModule {}
