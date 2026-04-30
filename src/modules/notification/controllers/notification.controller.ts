import { Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

import { NotificationQueryDto } from '../dto/notification-query.dto';
import { NotificationService } from '../services/notification.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

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
