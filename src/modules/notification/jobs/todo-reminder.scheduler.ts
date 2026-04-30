import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { NotificationRepository } from '../repositories/notification.repository';

import { NotificationQueue } from './notification.queue';

@Injectable()
export class TodoReminderScheduler {
  private readonly logger = new Logger(TodoReminderScheduler.name);

  constructor(
    private readonly repo: NotificationRepository,
    private readonly notificationQueue: NotificationQueue,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendTodoReminders(): Promise<void> {
    this.logger.debug('Running todo reminder check...');

    const dueTodos = await this.repo.findTodosDueInTwoHours();
    if (!dueTodos.length) {
      return;
    }

    this.logger.debug(`Found ${dueTodos.length} todos to remind`);

    await Promise.all(
      dueTodos.map((todo) =>
        this.notificationQueue.dispatch({
          type: 'TODO_REMINDER',
          todoId: todo.id,
          userId: todo.userId,
          todoTitle: todo.title,
        }),
      ),
    );
  }
}
