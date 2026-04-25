import { Injectable } from '@nestjs/common';

import { DrizzleService } from '../drizzle.service';
import { creditProducts } from '../schemas/monetization/credit-products';

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

    console.log('Credit products seeded');
  }
}
