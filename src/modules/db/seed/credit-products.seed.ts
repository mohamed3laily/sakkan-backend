import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DrizzleService } from '../drizzle.service';
import { creditProducts } from '../schemas/monetization/credit-products';

const APPLE_BUNDLE_PREFIX = 'com.sakanapp.ios';

const APPLE_PRODUCT_IDS: { key: string; suffix: string }[] = [
  { key: 'serious_single', suffix: 'serious_single' },
  { key: 'featured_single', suffix: 'featured_single' },
  { key: 'featured_bundle', suffix: 'featured_bundle' },
];

@Injectable()
export class CreditProductsSeed {
  constructor(private readonly drizzle: DrizzleService) {}

  async run() {
    const db = this.drizzle.db;

    console.log('Seeding credit products...');

    await db.delete(creditProducts);

    await db.insert(creditProducts).values([
      {
        key: 'serious_single',
        displayNameEn: 'Serious Request',
        displayNameAr: 'طلب جاد',
        creditType: 'serious',
        credits: 1,
        priceEgp: 99,
        isActive: true,
        sortOrder: 1,
      },
      {
        key: 'featured_single',
        displayNameEn: 'Featured Ad',
        displayNameAr: 'إعلان مميز (فردى)',
        creditType: 'featured',
        credits: 1,
        priceEgp: 99,
        isActive: true,
        sortOrder: 2,
      },
      {
        key: 'featured_bundle',
        displayNameEn: 'Featured Bundle',
        displayNameAr: 'باقة إعلانات مميزة',
        creditType: 'featured',
        credits: 15,
        priceEgp: 999,
        isActive: true,
        sortOrder: 3,
      },
    ]);

    for (const { key, suffix } of APPLE_PRODUCT_IDS) {
      await db
        .update(creditProducts)
        .set({ appleProductId: `${APPLE_BUNDLE_PREFIX}.${suffix}` })
        .where(eq(creditProducts.key, key));
    }

    console.log('Credit products seeded');
  }
}
