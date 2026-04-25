import { Injectable } from '@nestjs/common';

import { DrizzleService } from '../drizzle.service';
import { appSettings } from '../schemas/app/app-settings';

@Injectable()
export class AppSettingsSeed {
  constructor(private readonly drizzle: DrizzleService) {}

  async run() {
    const db = this.drizzle.db;

    console.log('Seeding app settings...');

    await db.delete(appSettings);

    await db.insert(appSettings).values({
      id: 1,
      phones: ['+201200000000', '+201000000000'],
      email: 'support@example.com',
      termsAndConditions: `TERMS AND CONDITIONS

Last updated: 25 April 2026

1. INTRODUCTION
These Terms and Conditions ("Terms") govern your access to and use of the Sakkan mobile application and related services (the "Service"), operated by us. By creating an account, listing a property, or otherwise using the Service, you agree to be bound by these Terms. If you do not agree, you must not use the Service.

2. ELIGIBILITY AND ACCOUNTS
You must be at least 18 years old and legally able to enter into a contract. You are responsible for the accuracy of information you provide, including your name, contact details, and verification materials. You must keep your login credentials secure and notify us immediately of any unauthorized use.

3. PROPERTY LISTINGS
3.1 You may only list properties that you are lawfully entitled to advertise (e.g. as owner, licensed agent, or with written authorization).
3.2 Listings must describe the property truthfully, including area, price, status (for sale, rent, etc.), and any material facts. Misleading, duplicate, or fraudulent listings are prohibited.
3.3 We may review, remove, or refuse any listing that violates these Terms, applicable law, or our community guidelines, without prior notice where permitted by law.
3.4 Maps, images, and descriptions are provided by users. We do not warrant the accuracy of third-party or user-generated content on the map or in search results.

4. USER CONDUCT
You agree not to: (a) harass, defame, or defraud other users; (b) scrape, overload, or disrupt the Service; (c) use the Service for money laundering, spam, or illegal activities; (d) post discriminatory or offensive content. We may suspend or terminate accounts that breach these rules.

5. SUBSCRIPTIONS, CREDITS, AND PAYMENTS
Certain features (e.g. serious requests, featured ads, or subscriptions) may require payment. Fees, billing cycles, and refund rules are shown at the time of purchase. Unless stated otherwise, fees are in Egyptian Pounds (EGP) and may change with notice for future periods. You authorize us and our payment partners to charge the payment method you provide.

6. INTELLECTUAL PROPERTY
The Service, including its design, logos, and software, is protected by copyright and other laws. You retain ownership of content you upload but grant us a non-exclusive, worldwide license to host, display, and distribute that content in connection with the Service.

7. DISCLAIMERS
The Service is provided "as is." We are a platform that connects property seekers and listers. We are not a party to any transaction between users, and we do not guarantee that any listing will result in a sale, lease, or investment. You are solely responsible for verifying property details, legal title, and compliance with local regulations before entering into any agreement.

8. LIMITATION OF LIABILITY
To the maximum extent permitted by law, we shall not be liable for indirect, incidental, special, or consequential damages, or for loss of profits, data, or goodwill. Our total liability for any claim arising from these Terms or the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim, or one hundred EGP (EGP 100) if you have not paid us, whichever is greater.

9. CHANGES
We may update these Terms from time to time. We will post the revised Terms in the app or on our website and update the "Last updated" date. Continued use after changes constitutes your acceptance, except where we are required to obtain your explicit consent.

10. CONTACT
For questions about these Terms, contact us using the support phone number and email shown in the app settings.

By using Sakkan, you acknowledge that you have read and understood these Terms and agree to be bound by them.`,
    });

    console.log('App settings seeded');
  }
}
