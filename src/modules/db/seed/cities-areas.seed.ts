import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { areas, cities } from '../schemas/schema-index';

@Injectable()
export class CitiesAreasSeed {
  constructor(private readonly drizzle: DrizzleService) {}

  async run() {
    const db = this.drizzle.db;

    console.log('🌱 Seeding Egyptian cities & areas...');

    /**
     * 1️⃣ Cities WITH lat/long
     */
    await db
      .insert(cities)
      .values([
        {
          nameEn: 'Cairo',
          nameAr: 'القاهرة',
          latitude: 30.0444,
          longitude: 31.2357,
        },
        {
          nameEn: 'Alexandria',
          nameAr: 'الإسكندرية',
          latitude: 31.2001,
          longitude: 29.9187,
        },
        {
          nameEn: 'Giza',
          nameAr: 'الجيزة',
          latitude: 30.0131,
          longitude: 31.2089,
        },
        {
          nameEn: 'Dakahlia',
          nameAr: 'الدقهلية',
          latitude: 31.0364,
          longitude: 31.3807,
        },
      ])
      .onConflictDoNothing();

    /**
     * 2️⃣ Fetch city IDs
     */
    const cityRows = await db.select().from(cities);

    const cityIdByName = Object.fromEntries(
      cityRows.map((city) => [city.nameEn, city.id]),
    ) as Record<string, number>;

    await db
      .insert(areas)
      .values([
        {
          cityId: cityIdByName.Cairo,
          nameEn: 'Nasr City',
          nameAr: 'مدينة نصر',
          latitude: 30.0566,
          longitude: 31.33,
        },
        {
          cityId: cityIdByName.Cairo,
          nameEn: 'Heliopolis',
          nameAr: 'مصر الجديدة',
          latitude: 30.0916,
          longitude: 31.33,
        },
        {
          cityId: cityIdByName.Cairo,
          nameEn: 'Maadi',
          nameAr: 'المعادي',
          latitude: 29.9602,
          longitude: 31.2569,
        },
        {
          cityId: cityIdByName.Cairo,
          nameEn: 'Zamalek',
          nameAr: 'الزمالك',
          latitude: 30.0626,
          longitude: 31.2197,
        },
        {
          cityId: cityIdByName.Cairo,
          nameEn: 'Shubra',
          nameAr: 'شبرا',
          latitude: 30.08,
          longitude: 31.245,
        },

        // ---------------- Giza (partial) ----------------
        {
          cityId: cityIdByName.Giza,
          nameEn: 'Dokki',
          nameAr: 'الدقي',
          latitude: 30.0384,
          longitude: 31.2101,
        },
        {
          cityId: cityIdByName.Giza,
          nameEn: 'Mohandessin',
          nameAr: 'المهندسين',
          latitude: 30.0495,
          longitude: 31.1995,
        },
        {
          cityId: cityIdByName.Giza,
          nameEn: '6th of October',
          nameAr: '6 أكتوبر',
          latitude: 29.9285,
          longitude: 30.9188,
        },

        // ---------------- Alexandria (ONLY one with coords) ----------------
        {
          cityId: cityIdByName.Alexandria,
          nameEn: 'Smouha',
          nameAr: 'سموحة',
          latitude: 31.2156,
          longitude: 29.9553,
        },
        {
          cityId: cityIdByName.Alexandria,
          nameEn: 'Stanley',
          nameAr: 'ستانلي',
        },

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
