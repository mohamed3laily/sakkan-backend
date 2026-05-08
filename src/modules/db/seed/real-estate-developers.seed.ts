import { Injectable } from '@nestjs/common';
import { asc, eq, inArray, or, sql } from 'drizzle-orm';

import { DrizzleService } from '../drizzle.service';
import { areas, cities, listings, propertyType } from '../schemas/schema-index';
import { developersProjects } from '../schemas/real-state-developers/developers-projects';
import { realEstateDevelopers } from '../schemas/real-state-developers/real-estate-developers';

/** Prefix for idempotent re-seeding; only rows with this prefix are removed. */
const SEED_NAME_PREFIX = 'SEED:';

@Injectable()
export class RealEstateDevelopersSeed {
  constructor(private readonly drizzle: DrizzleService) {}

  async run() {
    const db = this.drizzle.db;

    console.log('Seeding real estate developers & projects (demo)...');

    const [city] = await db.select().from(cities).orderBy(asc(cities.id)).limit(1);
    if (!city) {
      console.warn(
        'RealEstateDevelopersSeed: no cities in database; skip (run CitiesAreasSeed or import cities first).',
      );
      return;
    }

    const [area] = await db
      .select()
      .from(areas)
      .where(eq(areas.cityId, city.id))
      .orderBy(asc(areas.id))
      .limit(1);

    const seedProjectIds = await db
      .select({ id: developersProjects.id })
      .from(developersProjects)
      .where(sql`${developersProjects.name} LIKE ${SEED_NAME_PREFIX + '%'}`);

    const listingCleanupWhere =
      seedProjectIds.length > 0
        ? or(
            sql`${listings.title} LIKE ${SEED_NAME_PREFIX + '%'}`,
            inArray(
              listings.projectId,
              seedProjectIds.map((r) => r.id),
            ),
          )
        : sql`${listings.title} LIKE ${SEED_NAME_PREFIX + '%'}`;

    await db.delete(listings).where(listingCleanupWhere);

    await db
      .delete(developersProjects)
      .where(sql`${developersProjects.name} LIKE ${SEED_NAME_PREFIX + '%'}`);

    await db
      .delete(realEstateDevelopers)
      .where(sql`${realEstateDevelopers.name} LIKE ${SEED_NAME_PREFIX + '%'}`);

    const [dev1] = await db
      .insert(realEstateDevelopers)
      .values({
        name: `${SEED_NAME_PREFIX} Orascom Development`,
        logo: 'https://via.placeholder.com/120x120.png?text=OD',
      })
      .returning({ id: realEstateDevelopers.id });

    const [dev2] = await db
      .insert(realEstateDevelopers)
      .values({
        name: `${SEED_NAME_PREFIX} Palm Hills Developments`,
        logo: 'https://via.placeholder.com/120x120.png?text=PHD',
      })
      .returning({ id: realEstateDevelopers.id });

    const [dev3] = await db
      .insert(realEstateDevelopers)
      .values({
        name: `${SEED_NAME_PREFIX} MADAR Developments`,
        logo: 'https://via.placeholder.com/120x120.png?text=MAD',
      })
      .returning({ id: realEstateDevelopers.id });

    if (!dev1 || !dev2 || !dev3) {
      console.warn('RealEstateDevelopersSeed: failed to insert developers');
      return;
    }

    const insertedProjects = await db
      .insert(developersProjects)
      .values([
        {
          developerId: dev1.id,
          cityId: city.id,
          areaId: area?.id ?? null,
          name: `${SEED_NAME_PREFIX} O West — October`,
          description: 'Compound with townhouses and apartments near October amenities.',
          banner: 'https://via.placeholder.com/800x320.png?text=O+West',
          address: '6th of October City, Giza',
          latitude: city.latitude ?? 29.97,
          longitude: city.longitude ?? 30.95,
          priceStartingFrom: 3_500_000,
          commissionPercentage: 2.5,
          phone: '+201095482308',
        },
        {
          developerId: dev1.id,
          cityId: city.id,
          areaId: null,
          name: `${SEED_NAME_PREFIX} O West Phase 2`,
          description: 'Upcoming phase; registration for early inventory.',
          banner: 'https://via.placeholder.com/800x320.png?text=O+West+2',
          address: '6th of October City, Giza',
          latitude: city.latitude ?? 29.97,
          longitude: city.longitude ?? 30.95,
          priceStartingFrom: 4_200_000,
          commissionPercentage: 2.5,
          phone: '+201095482308',
        },
        {
          developerId: dev2.id,
          cityId: city.id,
          areaId: area?.id ?? null,
          name: `${SEED_NAME_PREFIX} Palm Hills New Cairo`,
          description: 'Villas and twin houses in a gated community.',
          banner: 'https://via.placeholder.com/800x320.png?text=PH+NC',
          address: 'New Cairo, Cairo',
          latitude: city.latitude ?? 30.02,
          longitude: city.longitude ?? 31.48,
          priceStartingFrom: 8_500_000,
          commissionPercentage: 3,
          phone: '+201095482308',
        },
        {
          developerId: dev3.id,
          cityId: city.id,
          areaId: null,
          name: `${SEED_NAME_PREFIX} MADAR Almaza Bay`,
          description: 'North Coast chalets with sea views.',
          banner: 'https://via.placeholder.com/800x320.png?text=MADAR+Bay',
          address: 'North Coast, Marsa Matrouh',
          latitude: 31.02,
          longitude: 28.85,
          priceStartingFrom: 6_800_000,
          commissionPercentage: 2.75,
          phone: '+201095482308',
        },
      ])
      .returning({
        id: developersProjects.id,
        name: developersProjects.name,
        priceStartingFrom: developersProjects.priceStartingFrom,
      });

    const propTypeRows = await db
      .select({ id: propertyType.id })
      .from(propertyType)
      .orderBy(asc(propertyType.id))
      .limit(2);

    if (propTypeRows.length === 0) {
      console.warn(
        'RealEstateDevelopersSeed: no property_type rows; skipped listings (run PropertyTypeSeed or migrate).',
      );
    } else {
      await db.insert(listings).values(
        insertedProjects.map((project, index) => {
          const pt = propTypeRows[index % propTypeRows.length];
          if (!pt) {
            throw new Error('RealEstateDevelopersSeed: property type missing for listing row');
          }
          return {
            title: `${SEED_NAME_PREFIX} ${project.name}`,
            description: 'Demo unit linked to developer project (seed).',
            userId: null,
            dealType: 'BUY' as const,
            listingType: 'OFFER' as const,
            propertyTypeId: pt.id,
            cityId: city.id,
            areaIds: area?.id ? [area.id] : [],
            budgetType: 'MARKET' as const,
            price: project.priceStartingFrom ?? 3_000_000,
            projectId: project.id,
            spaceSqm: 120,
            numberOfRooms: 3,
          };
        }),
      );
    }

    console.log(
      `Real estate developers & projects seeded (city id ${city.id}${area ? `, area id ${area.id}` : ''}; ${insertedProjects.length} projects, ${propTypeRows.length ? `${insertedProjects.length} listings` : '0 listings'}).`,
    );
  }
}
