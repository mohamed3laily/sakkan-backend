import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { cities } from '../schemas/schema-index';

@Injectable()
export class CitiesSeed {
  constructor(private readonly drizzle: DrizzleService) {}

  async run() {
    const db = this.drizzle.db;

    console.log('🌱 Seeding Egyptian cities...');

    await db
      .insert(cities)
      .values([
        { nameEn: 'Cairo', nameAr: 'القاهرة', latitude: 30.0444, longitude: 31.2357 },
        { nameEn: 'Giza', nameAr: 'الجيزة', latitude: 30.0131, longitude: 31.2089 },
        { nameEn: 'Alexandria', nameAr: 'الإسكندرية', latitude: 31.2001, longitude: 29.9187 },
        { nameEn: 'Dakahlia', nameAr: 'الدقهلية', latitude: 31.0364, longitude: 31.3807 },
        { nameEn: 'Red Sea', nameAr: 'البحر الأحمر', latitude: 26.8217, longitude: 33.9364 },
        { nameEn: 'Beheira', nameAr: 'البحيرة', latitude: 30.8481, longitude: 30.3436 },
        { nameEn: 'Fayoum', nameAr: 'الفيوم', latitude: 29.3084, longitude: 30.8428 },
        { nameEn: 'Gharbia', nameAr: 'الغربية', latitude: 30.8754, longitude: 31.0335 },
        { nameEn: 'Ismailia', nameAr: 'الإسماعيلية', latitude: 30.5965, longitude: 32.2715 },
        { nameEn: 'Menofia', nameAr: 'المنوفية', latitude: 30.5972, longitude: 30.9876 },
        { nameEn: 'Minya', nameAr: 'المنيا', latitude: 28.0871, longitude: 30.7618 },
        { nameEn: 'Qalyubia', nameAr: 'القليوبية', latitude: 30.3292, longitude: 31.2165 },
        { nameEn: 'New Valley', nameAr: 'الوادي الجديد', latitude: 25.4514, longitude: 30.5466 },
        { nameEn: 'Suez', nameAr: 'السويس', latitude: 29.9668, longitude: 32.5498 },
        { nameEn: 'Aswan', nameAr: 'أسوان', latitude: 24.0889, longitude: 32.8998 },
        { nameEn: 'Assiut', nameAr: 'أسيوط', latitude: 27.1809, longitude: 31.1837 },
        { nameEn: 'Beni Suef', nameAr: 'بني سويف', latitude: 29.0661, longitude: 31.0994 },
        { nameEn: 'Port Said', nameAr: 'بورسعيد', latitude: 31.2653, longitude: 32.3019 },
        { nameEn: 'Damietta', nameAr: 'دمياط', latitude: 31.4165, longitude: 31.8133 },
        { nameEn: 'Sharkia', nameAr: 'الشرقية', latitude: 30.7326, longitude: 31.7195 },
        { nameEn: 'South Sinai', nameAr: 'جنوب سيناء', latitude: 28.5558, longitude: 33.975 },
        { nameEn: 'Kafr El Sheikh', nameAr: 'كفر الشيخ', latitude: 31.1107, longitude: 30.939 },
        { nameEn: 'Matrouh', nameAr: 'مطروح', latitude: 31.3543, longitude: 27.2373 },
        { nameEn: 'Luxor', nameAr: 'الأقصر', latitude: 25.6872, longitude: 32.6396 },
        { nameEn: 'Qena', nameAr: 'قنا', latitude: 26.1551, longitude: 32.716 },
        { nameEn: 'North Sinai', nameAr: 'شمال سيناء', latitude: 30.2824, longitude: 33.6176 },
        { nameEn: 'Sohag', nameAr: 'سوهاج', latitude: 26.5591, longitude: 31.6957 },
      ])
      .onConflictDoNothing();

    console.log('✅ Egyptian cities seeded successfully');
  }
}
