import { Injectable, Inject } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { propertyType } from '../schemas/schema-index';

const propertyTypeData = [
  // LAND
  { parent: 'LAND', nameAr: 'أرض زراعية', nameEn: 'Agricultural Land' },
  { parent: 'LAND', nameAr: 'أرض محطة بنزين', nameEn: 'Gas Station Land' },
  { parent: 'LAND', nameAr: 'أرض سكنية', nameEn: 'Residential Land' },
  { parent: 'LAND', nameAr: 'بنك', nameEn: 'Bank Land' },
  { parent: 'LAND', nameAr: 'بيت هدم', nameEn: 'Demolition House' },
  { parent: 'LAND', nameAr: 'أرض تعليمية', nameEn: 'Educational Land' },
  { parent: 'LAND', nameAr: 'أرض تجارية', nameEn: 'Commercial Land' },
  { parent: 'LAND', nameAr: 'أرض صناعية', nameEn: 'Industrial Land' },
  { parent: 'LAND', nameAr: 'أرض مستشفى', nameEn: 'Hospital Land' },
  { parent: 'LAND', nameAr: 'أرض مسجد', nameEn: 'Mosque Land' },
  { parent: 'LAND', nameAr: 'أرض مستودع', nameEn: 'Warehouse Land' },
  { parent: 'LAND', nameAr: 'أرض خام', nameEn: 'Raw Land' },
  { parent: 'LAND', nameAr: 'أرض شاليه', nameEn: 'Chalet Land' },

  // VILLA_PALACE
  { parent: 'VILLA_PALACE', nameAr: 'قصر', nameEn: 'Palace' },
  { parent: 'VILLA_PALACE', nameAr: 'بيت شعبي', nameEn: 'Traditional House' },
  { parent: 'VILLA_PALACE', nameAr: 'فيلا في مجمع سكني', nameEn: 'Villa in Residential Compound' },
  { parent: 'VILLA_PALACE', nameAr: 'فيلا', nameEn: 'Villa' },
  { parent: 'VILLA_PALACE', nameAr: 'فيلا مع شقتين', nameEn: 'Villa with Two Apartments' },
  { parent: 'VILLA_PALACE', nameAr: 'فيلا عظم', nameEn: 'Shell Villa' },
  { parent: 'VILLA_PALACE', nameAr: 'فيلا مع شقة', nameEn: 'Villa with Apartment' },

  // APARTMENT_ROOM
  { parent: 'APARTMENT_ROOM', nameAr: 'غرفة', nameEn: 'Room' },
  { parent: 'APARTMENT_ROOM', nameAr: 'شقة', nameEn: 'Apartment' },
  { parent: 'APARTMENT_ROOM', nameAr: 'شقة في برج سكني', nameEn: 'Apartment in Residential Tower' },
  { parent: 'APARTMENT_ROOM', nameAr: 'شقة وروف', nameEn: 'Apartment with Roof' },
  { parent: 'APARTMENT_ROOM', nameAr: 'ستوديو', nameEn: 'Studio' },
  { parent: 'APARTMENT_ROOM', nameAr: 'شقة مفروشة', nameEn: 'Furnished Apartment' },
  {
    parent: 'APARTMENT_ROOM',
    nameAr: 'شقة في مجمع سكني',
    nameEn: 'Apartment in Residential Compound',
  },
  { parent: 'APARTMENT_ROOM', nameAr: 'شقة دوبليكس', nameEn: 'Duplex Apartment' },

  // FLOOR
  { parent: 'FLOOR', nameAr: 'دور', nameEn: 'Floor' },
  { parent: 'FLOOR', nameAr: 'دور وشقة', nameEn: 'Floor with Apartment' },
  { parent: 'FLOOR', nameAr: 'دور وشقتين', nameEn: 'Floor with Two Apartments' },
  { parent: 'FLOOR', nameAr: 'دور وثلاث شقق', nameEn: 'Floor with Three Apartments' },

  // BUILDING_TOWER
  { parent: 'BUILDING_TOWER', nameAr: 'برج', nameEn: 'Tower' },
  { parent: 'BUILDING_TOWER', nameAr: 'مبنى شقق مفروشة', nameEn: 'Furnished Apartments Building' },
  { parent: 'BUILDING_TOWER', nameAr: 'عمارة سكنية', nameEn: 'Residential Building' },
  { parent: 'BUILDING_TOWER', nameAr: 'عمارة تجارية', nameEn: 'Commercial Building' },
  { parent: 'BUILDING_TOWER', nameAr: 'عمارة', nameEn: 'Building' },
  { parent: 'BUILDING_TOWER', nameAr: 'عمارة تجارية سكنية', nameEn: 'Mixed-Use Building' },
  { parent: 'BUILDING_TOWER', nameAr: 'برج مكتبي', nameEn: 'Office Tower' },

  // SHOP_SHOWROOM
  { parent: 'SHOP_SHOWROOM', nameAr: 'معرض', nameEn: 'Showroom' },
  { parent: 'SHOP_SHOWROOM', nameAr: 'محل', nameEn: 'Shop' },
  { parent: 'SHOP_SHOWROOM', nameAr: 'مجمع تجاري', nameEn: 'Commercial Complex' },
  { parent: 'SHOP_SHOWROOM', nameAr: 'معرض سيارات', nameEn: 'Car Showroom' },
  { parent: 'SHOP_SHOWROOM', nameAr: 'ستريب مول', nameEn: 'Strip Mall' },
  { parent: 'SHOP_SHOWROOM', nameAr: 'مول', nameEn: 'Mall' },
  { parent: 'SHOP_SHOWROOM', nameAr: 'درايف ثرو', nameEn: 'Drive-Through' },

  // CHALET_RESORT
  { parent: 'CHALET_RESORT', nameAr: 'منتجع', nameEn: 'Resort' },
  { parent: 'CHALET_RESORT', nameAr: 'شاليه', nameEn: 'Chalet' },
  { parent: 'CHALET_RESORT', nameAr: 'استراحة', nameEn: 'Rest House' },
  { parent: 'CHALET_RESORT', nameAr: 'مخيم', nameEn: 'Camp' },
  { parent: 'CHALET_RESORT', nameAr: 'استراحة عزاب', nameEn: 'Bachelor Rest House' },

  // FARM_YARD
  { parent: 'FARM_YARD', nameAr: 'مزرعة', nameEn: 'Farm' },
  { parent: 'FARM_YARD', nameAr: 'حوش', nameEn: 'Yard' },

  // COMMERCIAL_SERVICE
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'مكتب', nameEn: 'Office' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'فندق', nameEn: 'Hotel' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'مستشفى', nameEn: 'Hospital' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'مطعم', nameEn: 'Restaurant' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'كافيه', nameEn: 'Cafe' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'مجمع طبي', nameEn: 'Medical Complex' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'مركز صحي', nameEn: 'Health Center' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'مدرسة', nameEn: 'School' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'مكاتب مشتركة', nameEn: 'Co-working Offices' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'مركز أعمال', nameEn: 'Business Center' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'موقف سيارات', nameEn: 'Parking Lot' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'مخازن سحابية', nameEn: 'Cloud Storage Warehouses' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'قاعة أفراح', nameEn: 'Wedding Hall' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'سينما', nameEn: 'Cinema' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'موقع صراف', nameEn: 'ATM Site' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'محطة كهرباء', nameEn: 'Power Station' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'برج اتصالات', nameEn: 'Telecom Tower' },
  { parent: 'COMMERCIAL_SERVICE', nameAr: 'محطة', nameEn: 'Station' },

  // INDUSTRIAL_LOGISTICS
  { parent: 'INDUSTRIAL_LOGISTICS', nameAr: 'سكن عمال', nameEn: 'Workers Accommodation' },
  { parent: 'INDUSTRIAL_LOGISTICS', nameAr: 'مصنع', nameEn: 'Factory' },
  { parent: 'INDUSTRIAL_LOGISTICS', nameAr: 'مستودع', nameEn: 'Warehouse' },
  { parent: 'INDUSTRIAL_LOGISTICS', nameAr: 'ورشة', nameEn: 'Workshop' },
] as const;

@Injectable()
export class PropertyTypeSeed {
  constructor(private readonly drizzleService: DrizzleService) {}

  async run() {
    console.log('Seeding property types...');

    await this.drizzleService.db.insert(propertyType).values(
      propertyTypeData.map((item) => ({
        parent: item.parent as any,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
      })),
    );

    console.log(`✅ Seeded ${propertyTypeData.length} property types.`);
  }
}
