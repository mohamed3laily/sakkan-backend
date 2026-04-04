import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { areas, cities } from '../schemas/schema-index';

import * as fs from 'fs';
import * as path from 'path';
import * as turf from '@turf/turf';

@Injectable()
export class CitiesAreasSeed {
  constructor(private readonly drizzle: DrizzleService) {}

  async run() {
    const db = this.drizzle.db;

    console.log('🌱 Seeding Egyptian cities & areas from GeoJSON...');

    // ─────────────────────────────────────────────
    // 1️⃣ Load GeoJSON
    // ─────────────────────────────────────────────
    //src/modules/city/data/egypt-geo.json
    const filePath = path.join(__dirname, '../../city/data/egypt-geo.json');
    const geojson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const features = geojson.features;

    // ─────────────────────────────────────────────
    // 2️⃣ Extract Cities (Governorates)
    // ─────────────────────────────────────────────
    const cityMap = new Map<
      string,
      { nameEn: string; nameAr: string; lat: number; lng: number; count: number }
    >();

    for (const feature of features) {
      const { governorate_en, governorate_ar } = feature.properties;

      const polygon = turf.feature(feature.geometry);
      const centroid = turf.centroid(polygon);
      const [lng, lat] = centroid.geometry.coordinates;

      if (!cityMap.has(governorate_en)) {
        cityMap.set(governorate_en, {
          nameEn: governorate_en,
          nameAr: governorate_ar,
          lat,
          lng,
          count: 1,
        });
      } else {
        // average centroid for better city center approximation
        const existing = cityMap.get(governorate_en)!;
        existing.lat = (existing.lat * existing.count + lat) / (existing.count + 1);
        existing.lng = (existing.lng * existing.count + lng) / (existing.count + 1);
        existing.count++;
      }
    }

    const cityValues = Array.from(cityMap.values()).map((c) => ({
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      latitude: c.lat,
      longitude: c.lng,
    }));

    await db.insert(cities).values(cityValues).onConflictDoNothing();

    // ─────────────────────────────────────────────
    // 3️⃣ Fetch City IDs
    // ─────────────────────────────────────────────
    const cityRows = await db.select().from(cities);

    const cityIdByName = Object.fromEntries(cityRows.map((c) => [c.nameEn, c.id])) as Record<
      string,
      number
    >;

    // ─────────────────────────────────────────────
    // 4️⃣ Extract Areas
    // ─────────────────────────────────────────────
    const areaValues = features.map((feature) => {
      const { area_en, area_ar, governorate_en } = feature.properties;

      const polygon = turf.feature(feature.geometry);
      const centroid = turf.centroid(polygon);
      const [lng, lat] = centroid.geometry.coordinates;

      return {
        cityId: cityIdByName[governorate_en],
        nameEn: area_en,
        nameAr: area_ar,
        latitude: lat,
        longitude: lng,
      };
    });

    await db.insert(areas).values(areaValues).onConflictDoNothing();

    console.log('✅ Done');
    console.log(`   Cities: ${cityValues.length}`);
    console.log(`   Areas: ${areaValues.length}`);
  }
}
