import { Inject, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

import { FIREBASE_APP } from './firebase.provider';
import { LogAction } from 'src/common/logging';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private readonly messaging: admin.messaging.Messaging;

  constructor(@Inject(FIREBASE_APP) app: admin.app.App) {
    this.messaging = app.messaging();
  }

  async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const payload = {
        token,
        notification: { title, body },
        data,
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      await this.messaging.send(payload);
    } catch (err: unknown) {
      this.logger.warn(
        ({
          action: LogAction.FCM_SEND_FAILED,
          tokenPrefix: token.slice(0, 15),
          errorCode: err instanceof Error ? err.message : String(err),
        }),
        'FCM send failed',
      );
    }
  }

  async sendToMultipleTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    try {
      const payload = {
        tokens,
        notification: { title, body },
        data,
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await this.messaging.sendEachForMulticast(payload);
      const successCount = response.successCount;
      const failureCount = response.failureCount;

      if (failureCount > 0) {
        const errorCodes = response.responses
          .filter((r) => !r.success)
          .map((r) => r.error?.code ?? 'unknown')
          .slice(0, 5);

        this.logger.warn(
          ({
            action: LogAction.FCM_MULTICAST_RESULT,
            successCount,
            failureCount,
            totalTokens: tokens.length,
            errorCodes,
          }),
          'FCM multicast partial failure',
        );
      }
    } catch (err) {
      this.logger.error(
        ({
          action: LogAction.FCM_SEND_FAILED,
          totalTokens: tokens.length,
        }),
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
