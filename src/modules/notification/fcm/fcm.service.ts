import { Inject, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

import { FIREBASE_APP } from './firebase.provider';

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

    } catch (err: any) {

      this.logger.warn(
        `FCM send failed for token ${token.slice(0, 15)}...`,
      );
    }
  }

  async sendToMultipleTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
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
      response.responses.forEach((r, index) => {

      });
    } catch (err) {  
      this.logger.error(err);
    }
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );
  }
}
