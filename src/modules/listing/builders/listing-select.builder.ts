import { listings } from '../../db/schemas/listing/listing';
import { cities } from '../../db/schemas/cities/cities';
import { areas } from '../../db/schemas/cities/areas';
import { propertyType } from '../../db/schemas/listing/property-type';
import { sql } from 'drizzle-orm';

export class ListingSelectBuilder {
  static getSelectFields() {
    return {
      id: listings.id,
      title: listings.title,
      description: listings.description,
      userId: listings.userId,
      dealType: listings.dealType,
      listingType: listings.listingType,
      propertyType: {
        id: propertyType.id,
        nameAr: propertyType.nameAr,
        nameEn: propertyType.nameEn,
      },
      cityId: listings.cityId,
      areas: sql<{ id: number; name: string }[]>`
      COALESCE(
        (
          SELECT json_agg(json_build_object('id', ${areas.id}, 'nameEn', ${areas.nameEn}, 'nameAr', ${areas.nameAr}))
          FROM ${areas}
          WHERE ${areas.id} = ANY(${listings.areaIds})
        ),
        '[]'
      )
    `.as('areas'),
      budgetType: listings.budgetType,
      price: listings.price,
      spaceSqm: listings.spaceSqm,
      numberOfRooms: listings.numberOfRooms,
      numberOfBathrooms: listings.numberOfBathrooms,
      latitude: listings.latitude,
      longitude: listings.longitude,
      mPrice: listings.mPrice,
      propertyAge: listings.propertyAge,
      paymentMethod: listings.paymentMethod,
      contactWhatsapp: listings.contactWhatsapp,
      contactPhone: listings.contactPhone,
      isSerious: listings.isSerious,
      createdAt: listings.createdAt,

      city: {
        id: cities.id,
        nameEn: cities.nameEn,
        nameAr: cities.nameAr,
      },
    };
  }
}
