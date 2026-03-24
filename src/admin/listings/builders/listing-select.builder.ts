import { sql } from 'drizzle-orm';
import { areas, cities, listings, propertyType } from 'src/modules/db/schemas/schema-index';
import { users } from 'src/modules/db/schemas/user/user';

export class ListingSelectBuilder {
  static getSelectFields() {
    return {
      id: listings.id,
      title: listings.title,
      description: listings.description,
      dealType: listings.dealType,
      listingType: listings.listingType,
      propertyType: {
        id: propertyType.id,
        nameAr: propertyType.nameAr,
        nameEn: propertyType.nameEn,
      },
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
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        profilePicture: users.profilePicture,
        type: users.type,
      },
    };
  }
}
