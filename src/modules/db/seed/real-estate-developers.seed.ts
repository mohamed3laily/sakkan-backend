import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm';

import { DrizzleService } from '../drizzle.service';
import { areas, cities, listings, propertyType, attachments } from '../schemas/schema-index';
import { developersProjects } from '../schemas/real-state-developers/developers-projects';
import { realEstateDevelopers } from '../schemas/real-state-developers/real-estate-developers';
import { paymentMethodEnum } from '../schemas/listing/enums';

/** Prefix for idempotent re-seeding; only rows with this prefix are removed. */
const SEED_NAME_PREFIX = 'SEED:';

type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];

function randomDeveloperPaymentMethods(): PaymentMethod[] {
  const pool = paymentMethodEnum.enumValues;
  const chosen = pool.filter(() => Math.random() < 0.5);
  if (chosen.length === 0) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick === undefined) {
      throw new Error('RealEstateDevelopersSeed: payment_method enum empty');
    }
    return [pick];
  }
  return chosen;
}

function randomIntInclusive(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

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
      .where(sql`${developersProjects.nameEn} LIKE ${SEED_NAME_PREFIX + '%'}`);

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

    const seedListingIdsToRemove = await db
      .select({ id: listings.id })
      .from(listings)
      .where(listingCleanupWhere);

    if (seedListingIdsToRemove.length > 0) {
      await db.delete(attachments).where(
        and(
          eq(attachments.attachableType, 'LISTING'),
          inArray(
            attachments.attachableId,
            seedListingIdsToRemove.map((r) => r.id),
          ),
        ),
      );
    }

    await db.delete(listings).where(listingCleanupWhere);

    if (seedProjectIds.length > 0) {
      await db.delete(attachments).where(
        and(
          eq(attachments.attachableType, 'DEVELOPER_PROJECT'),
          inArray(
            attachments.attachableId,
            seedProjectIds.map((r) => r.id),
          ),
        ),
      );
    }

    await db
      .delete(developersProjects)
      .where(sql`${developersProjects.nameEn} LIKE ${SEED_NAME_PREFIX + '%'}`);

    await db
      .delete(realEstateDevelopers)
      .where(sql`${realEstateDevelopers.nameEn} LIKE ${SEED_NAME_PREFIX + '%'}`);

    const [dev1] = await db
      .insert(realEstateDevelopers)
      .values({
        nameEn: `${SEED_NAME_PREFIX} Orascom Development`,
        nameAr: `${SEED_NAME_PREFIX} أوراسكوم للتطوير`,
        logo: 'https://ergodotisi.com/_next/image?url=https%3A%2F%2Fcache.ergodotisi.com%2Fimages%2Flogos%2F38429.jpg&w=3840&q=75',
      })
      .returning({ id: realEstateDevelopers.id });

    const [dev2] = await db
      .insert(realEstateDevelopers)
      .values({
        nameEn: `${SEED_NAME_PREFIX} Palm Hills Developments`,
        nameAr: `${SEED_NAME_PREFIX} بالم هيلز للتعمير`,
        logo: 'https://slnpd.com/wp-content/uploads/2024/09/WhatsApp-Image-2024-09-23-at-10.22.02-AM.jpeg',
      })
      .returning({ id: realEstateDevelopers.id });

    const [dev3] = await db
      .insert(realEstateDevelopers)
      .values({
        nameEn: `${SEED_NAME_PREFIX} MADAR Developments`,
        nameAr: `${SEED_NAME_PREFIX} مدار للتطوير`,
        logo: 'https://slnpd.com/wp-content/uploads/2024/09/WhatsApp-Image-2024-09-23-at-10.22.02-AM.jpeg',
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
          nameEn: `${SEED_NAME_PREFIX} O West — October`,
          nameAr: `${SEED_NAME_PREFIX} أو وست — أكتوبر`,
          descriptionEn: 'Compound with townhouses and apartments near October amenities.',
          descriptionAr: 'كمبوند فيلات وشقق بالقرب من خدمات أكتوبر.',
          addressEn: '6th of October City, Giza',
          addressAr: 'مدينة السادس من أكتوبر، الجيزة',
          latitude: city.latitude ?? 29.97,
          longitude: city.longitude ?? 30.95,
          priceStartingFrom: 3_500_000,
          commissionPercentage: 2.5,
          phone: '+201095482308',
          whatsappPhone: '+201095482308',
        },
        {
          developerId: dev1.id,
          cityId: city.id,
          areaId: null,
          nameEn: `${SEED_NAME_PREFIX} O West Phase 2`,
          nameAr: `${SEED_NAME_PREFIX} أو وست المرحلة الثانية`,
          descriptionEn: 'Upcoming phase; registration for early inventory.',
          descriptionAr: 'مرحلة قادمة؛ تسجيل مبكر للوحدات.',
          addressEn: '6th of October City, Giza',
          addressAr: 'مدينة السادس من أكتوبر، الجيزة',
          latitude: city.latitude ?? 29.97,
          longitude: city.longitude ?? 30.95,
          priceStartingFrom: 4_200_000,
          commissionPercentage: 2.5,
          phone: '+201095482308',
          whatsappPhone: '+201095482308',
        },
        {
          developerId: dev2.id,
          cityId: city.id,
          areaId: area?.id ?? null,
          nameEn: `${SEED_NAME_PREFIX} Palm Hills New Cairo`,
          nameAr: `${SEED_NAME_PREFIX} بالم هيلز القاهرة الجديدة`,
          descriptionEn: 'Villas and twin houses in a gated community.',
          descriptionAr: 'فيلات وتوين هاوس في مجمع مسور.',
          addressEn: 'New Cairo, Cairo',
          addressAr: 'القاهرة الجديدة، القاهرة',
          latitude: city.latitude ?? 30.02,
          longitude: city.longitude ?? 31.48,
          priceStartingFrom: 8_500_000,
          commissionPercentage: 3,
          phone: '+201095482308',
          whatsappPhone: '+201095482308',
        },
        {
          developerId: dev3.id,
          cityId: city.id,
          areaId: null,
          nameEn: `${SEED_NAME_PREFIX} MADAR Almaza Bay`,
          nameAr: `${SEED_NAME_PREFIX} مدار المازة باي`,
          descriptionEn: 'North Coast chalets with sea views.',
          descriptionAr: 'شاليهات على الساحل الشمالي بإطلالة بحرية.',
          addressEn: 'North Coast, Marsa Matrouh',
          addressAr: 'الساحل الشمالي، مرسى مطروح',
          latitude: 31.02,
          longitude: 28.85,
          priceStartingFrom: 6_800_000,
          commissionPercentage: 2.75,
          phone: '+201095482308',
          whatsappPhone: '+201095482308',
        },
      ])
      .returning({
        id: developersProjects.id,
        nameEn: developersProjects.nameEn,
        priceStartingFrom: developersProjects.priceStartingFrom,
      });

    await db.insert(attachments).values(
      insertedProjects.map((project) => ({
        attachableType: 'DEVELOPER_PROJECT' as const,
        attachableId: project.id,
        fileType: 'IMAGE' as const,
        url: `https://www.archistar.ai/wp-content/uploads/2021/02/iStock-1066713660.jpg`,
        key: `seed/developer-projects/${project.id}/cover.png`,
        mimeType: 'image/png',
        size: 1024,
      })),
    );

    const propTypeRows = await db
      .select({ id: propertyType.id })
      .from(propertyType)
      .orderBy(asc(propertyType.id))
      .limit(2);

    const listingImageUrls = [
      'https://www.object-1.com/wp-content/uploads/2025/04/image-1-1024x444.png',
    ] as const;

    if (propTypeRows.length === 0) {
      console.warn(
        'RealEstateDevelopersSeed: no property_type rows; skipped listings (run PropertyTypeSeed or migrate).',
      );
    } else {
      const insertedListings = await db
        .insert(listings)
        .values(
          insertedProjects.map((project, index) => {
            const pt = propTypeRows[index % propTypeRows.length];
            if (!pt) {
              throw new Error('RealEstateDevelopersSeed: property type missing for listing row');
            }
            return {
              title: `${SEED_NAME_PREFIX} ${project.nameEn}`,
              description: 'Demo unit linked to developer project (seed).',
              userId: null,
              dealType: 'BUY' as const,
              listingType: 'OFFER' as const,
              propertyTypeId: pt.id,
              cityId: city.id,
              areaIds: area?.id ? [area.id] : [],
              budgetType: 'MARKET' as const,
              price: 3_000_000,
              projectId: project.id,
              spaceSqm: 120,
              numberOfRooms: 3,
              numberOfBathrooms: 2,
              numberOfUnits: randomIntInclusive(1, 350),
              developerPaymentMethods: randomDeveloperPaymentMethods(),
              deliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            };
          }),
        )
        .returning({ id: listings.id });

      await db.insert(attachments).values(
        insertedListings.flatMap((listing) =>
          listingImageUrls.map((url, imageIndex) => ({
            attachableType: 'LISTING' as const,
            attachableId: listing.id,
            fileType: 'IMAGE' as const,
            url,
            key: `seed/listings/${listing.id}/image-${imageIndex + 1}.jpg`,
            mimeType: 'image/jpeg',
            size: 2048 + imageIndex,
          })),
        ),
      );
    }

    console.log(
      `Real estate developers & projects seeded (city id ${city.id}${area ? `, area id ${area.id}` : ''}; ${insertedProjects.length} projects, ${propTypeRows.length ? `${insertedProjects.length} listings (${listingImageUrls.length} image(s) each)` : '0 listings'}).`,
    );
  }
}
