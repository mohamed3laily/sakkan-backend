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
  
      console.log('================ FCM SEND START ================');
      console.log('token:', token);
      console.log('title:', title);
      console.log('body:', body);
      console.log('data:', JSON.stringify(data, null, 2));
      console.log('payload:', JSON.stringify(payload, null, 2));
  
      const response = await this.messaging.send(payload);
  
      console.log('================ FCM SEND SUCCESS ================');
      console.log('firebaseMessageId:', response);
      console.log('token:', token);
    } catch (err: any) {
      console.log('================ FCM SEND FAILED ================');
  
      console.error('RAW ERROR:', err);
  
      console.error('ERROR MESSAGE:', err?.message);
  
      console.error('ERROR CODE:', err?.code);
  
      console.error('ERROR DETAILS:', err?.details);
  
      console.error('ERROR STACK:', err?.stack);
  
      console.error('FULL ERROR JSON:', JSON.stringify(err, null, 2));
  
      console.error('TOKEN:', token);
  
      if (err?.errorInfo) {
        console.error('ERROR INFO:', err.errorInfo);
      }
  
      if (err?.code === 'messaging/registration-token-not-registered') {
        console.error('TOKEN IS INVALID / EXPIRED');
      }
  
      if (err?.code === 'messaging/invalid-registration-token') {
        console.error('TOKEN FORMAT INVALID');
      }
  
      if (err?.code === 'messaging/mismatched-credential') {
        console.error('FIREBASE PROJECT MISMATCH');
      }
  
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
      console.log('================ MULTICAST START ================');
  
      console.log('tokens:', tokens);
  
      console.log('title:', title);
  
      console.log('body:', body);
  
      console.log('data:', data);
  
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
  
      console.log('payload:', JSON.stringify(payload, null, 2));
  
      const response = await this.messaging.sendEachForMulticast(payload);
  
      console.log('================ MULTICAST RESPONSE ================');
  
      console.log('successCount:', response.successCount);
  
      console.log('failureCount:', response.failureCount);
  
      response.responses.forEach((r, index) => {
        console.log(`TOKEN ${index}:`, tokens[index]);
  
        if (r.success) {
          console.log('SUCCESS:', r.messageId);
        } else {
          console.error('FAILED:', r.error);
        }
      });
    } catch (err) {
      console.error('================ MULTICAST CRASH ================');
  
      console.error(err);
    }
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );
  }
}
