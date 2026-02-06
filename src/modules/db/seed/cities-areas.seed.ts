import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { cities, areas } from '../schemas/schema-index';

@Injectable()
export class CitiesAreasSeed {
  constructor(private readonly drizzle: DrizzleService) {}

  async run() {
    const db = this.drizzle.db;

    console.log('🌱 Seeding Egyptian cities & areas...');

    /**
     * 1️⃣ Insert cities (idempotent)
     */
    await db
      .insert(cities)
      .values([
        { nameEn: 'Cairo', nameAr: 'القاهرة' },
        { nameEn: 'Alexandria', nameAr: 'الإسكندرية' },
        { nameEn: 'Giza', nameAr: 'الجيزة' },
        { nameEn: 'Dakahlia', nameAr: 'الدقهلية' },
      ])
      .onConflictDoNothing();

    /**
     * 2️⃣ Fetch city IDs (SOURCE OF TRUTH)
     */
    const cityRows = await db.select().from(cities);

    const cityIdByName = Object.fromEntries(
      cityRows.map((city) => [city.nameEn, city.id]),
    ) as Record<string, number>;

    /**
     * 3️⃣ Areas (ALL cityId are guaranteed numbers)
     */
    await db
      .insert(areas)
      .values([
        // ---------------- Cairo ----------------
        {
          cityId: cityIdByName.Cairo,
          nameEn: 'Nasr City',
          nameAr: 'مدينة نصر',
        },
        {
          cityId: cityIdByName.Cairo,
          nameEn: 'Heliopolis',
          nameAr: 'مصر الجديدة',
        },
        {
          cityId: cityIdByName.Cairo,
          nameEn: 'Maadi',
          nameAr: 'المعادي',
        },
        {
          cityId: cityIdByName.Cairo,
          nameEn: 'Zamalek',
          nameAr: 'الزمالك',
        },
        {
          cityId: cityIdByName.Cairo,
          nameEn: 'Shubra',
          nameAr: 'شبرا',
        },

        // ---------------- Giza ----------------
        {
          cityId: cityIdByName.Giza,
          nameEn: 'Dokki',
          nameAr: 'الدقي',
        },
        {
          cityId: cityIdByName.Giza,
          nameEn: 'Mohandessin',
          nameAr: 'المهندسين',
        },
        {
          cityId: cityIdByName.Giza,
          nameEn: '6th of October',
          nameAr: '6 أكتوبر',
        },

        // ---------------- Alexandria ----------------
        {
          cityId: cityIdByName.Alexandria,
          nameEn: 'Smouha',
          nameAr: 'سموحة',
        },
        {
          cityId: cityIdByName.Alexandria,
          nameEn: 'Stanley',
          nameAr: 'ستانلي',
        },

        // ---------------- Dakahlia ----------------
        {
          cityId: cityIdByName.Dakahlia,
          nameEn: 'Mansoura',
          nameAr: 'المنصورة',
        },
        {
          cityId: cityIdByName.Dakahlia,
          nameEn: 'Talkha',
          nameAr: 'طلخا',
        },
        {
          cityId: cityIdByName.Dakahlia,
          nameEn: 'Mit Ghamr',
          nameAr: 'ميت غمر',
        },
      ])
      .onConflictDoNothing();

    console.log('✅ Egyptian cities & areas seeded successfully');
  }
}
