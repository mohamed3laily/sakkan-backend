import { listings } from '../../../../db/schemas/listing/listing';
import { cities } from '../../../../db/schemas/cities/cities';
import { areas } from '../../../../db/schemas/cities/areas';
import { propertyType } from '../../../../db/schemas/listing/property-type';
import { sql } from 'drizzle-orm';
import { users } from 'src/modules/db/schemas/user/user';

export class ListingSelectBuilder {
  static getSelectFields(userId?: number) {
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
      isFavorited: userId
        ? sql<boolean>`EXISTS (SELECT 1 FROM favorites WHERE favorites.user_id = ${userId} AND favorites.favoritable_type = 'LISTING' AND favorites.favoritable_id = ${listings.id})`.as(
            'isFavorited',
          )
        : sql<boolean>`false`.as('isFavorited'),
    };
  }
}
