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
      console.log('sending to token', token);
      console.log('title', title);
      console.log('body', body);
      console.log('data', data);
      console.log('apns', { payload: { aps: { sound: 'default' } } });
      console.log('android', { notification: { sound: 'default' } });
      await this.messaging.send({
        token,
        notification: { title, body },
        data,
        apns: { payload: { aps: { sound: 'default' } } },
        android: { notification: { sound: 'default' } },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`FCM send failed for token ${token.slice(0, 10)}…: ${message}`);
    }
  }

  async sendToMultipleTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!tokens.length) {
      return;
    }

    const chunks = this.chunkArray(tokens, 500);
    await Promise.all(
      chunks.map((chunk) =>
        this.messaging
          .sendEachForMulticast({ tokens: chunk, notification: { title, body }, data })
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.warn(`FCM multicast error: ${message}`);
          }),
      ),
    );
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );
  }
}
