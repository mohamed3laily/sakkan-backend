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
        { nameEn: 'Cairo', nameAr: 'القاهرة' },
        { nameEn: 'Giza', nameAr: 'الجيزة' },
        { nameEn: 'Alexandria', nameAr: 'الإسكندرية' },
        { nameEn: 'Dakahlia', nameAr: 'الدقهلية' },
        { nameEn: 'Red Sea', nameAr: 'البحر الأحمر' },
        { nameEn: 'Beheira', nameAr: 'البحيرة' },
        { nameEn: 'Fayoum', nameAr: 'الفيوم' },
        { nameEn: 'Gharbia', nameAr: 'الغربية' },
        { nameEn: 'Ismailia', nameAr: 'الإسماعيلية' },
        { nameEn: 'Menofia', nameAr: 'المنوفية' },
        { nameEn: 'Minya', nameAr: 'المنيا' },
        { nameEn: 'Qalyubia', nameAr: 'القليوبية' },
        { nameEn: 'New Valley', nameAr: 'الوادي الجديد' },
        { nameEn: 'Suez', nameAr: 'السويس' },
        { nameEn: 'Aswan', nameAr: 'أسوان' },
        { nameEn: 'Assiut', nameAr: 'أسيوط' },
        { nameEn: 'Beni Suef', nameAr: 'بني سويف' },
        { nameEn: 'Port Said', nameAr: 'بورسعيد' },
        { nameEn: 'Damietta', nameAr: 'دمياط' },
        { nameEn: 'Sharkia', nameAr: 'الشرقية' },
        { nameEn: 'South Sinai', nameAr: 'جنوب سيناء' },
        { nameEn: 'Kafr El Sheikh', nameAr: 'كفر الشيخ' },
        { nameEn: 'Matrouh', nameAr: 'مطروح' },
        { nameEn: 'Luxor', nameAr: 'الأقصر' },
        { nameEn: 'Qena', nameAr: 'قنا' },
        { nameEn: 'North Sinai', nameAr: 'شمال سيناء' },
        { nameEn: 'Sohag', nameAr: 'سوهاج' },
      ])
      .onConflictDoNothing();

    console.log('✅ Egyptian cities seeded successfully');
  }
}
