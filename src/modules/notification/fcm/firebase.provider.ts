import { Provider } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

export const FIREBASE_APP = 'FIREBASE_APP';

export const FirebaseProvider: Provider = {
  provide: FIREBASE_APP,
  inject: [ConfigService],
  useFactory: (config: ConfigService): admin.app.App => {
    const existing = admin.apps.find((a) => a?.name === 'notifications');
    if (existing) {
      return existing;
    }

    return admin.initializeApp(
      {
        credential: admin.credential.cert({
          projectId: config.getOrThrow<string>('FIREBASE_PROJECT_ID'),
          clientEmail: config.getOrThrow<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: config.getOrThrow<string>('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
        }),
      },
      'notifications',
    );
  },
};
