import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { TranslateInterceptor } from 'src/common/interceptors/translate.interceptor';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

import { NotificationQueryDto } from '../dto/notification-query.dto';
import { TestNotificationDto } from '../dto/test-notification.dto';
import { NotificationService } from '../services/notification.service';
import { NotificationTestService } from '../services/notification-test.service';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TranslateInterceptor)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationTestService: NotificationTestService,
  ) {}

  @Post('test')
  async sendTestNotification(@Body() dto: TestNotificationDto) {
    await this.notificationTestService.sendTestNotification(dto);
    return { message: 'NOTIFICATION_TEST_QUEUED' };
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: NotificationQueryDto) {
    return this.notificationService.getNotifications(user.id, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markAllAsRead(user.id);
  }
}
