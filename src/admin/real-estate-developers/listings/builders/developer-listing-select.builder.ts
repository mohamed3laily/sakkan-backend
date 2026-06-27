import { sql } from 'drizzle-orm';

import { listings } from 'src/modules/db/schemas/listing/listing';
import { propertyType } from 'src/modules/db/schemas/listing/property-type';
import {
  areas,
  attachments,
  cities,
  developersProjects,
  realEstateDevelopers,
} from 'src/modules/db/schemas/schema-index';
import type { ProjectPropertyDeliveryReadiness } from 'src/modules/real-estate-developer/property/enums/delivery-readiness';

type DeveloperListingProjectShape = {
  id: number;
  nameEn: string | null;
  nameAr: string | null;
  phone: string | null;
  whatsappPhone: string | null;
  latitude: number | null;
  longitude: number | null;
  addressEn: string | null;
  addressAr: string | null;
  city: { id: number; nameEn: string; nameAr: string } | null;
  area: { id: number; nameEn: string; nameAr: string } | null;
};

type DeveloperListingDeveloperShape = {
  id: number;
  nameEn: string | null;
  nameAr: string | null;
  logo: string;
};

export const developerListingSelectFields = {
  id: listings.id,
  projectId: listings.projectId,
  title: listings.title,
  description: listings.description,
  status: listings.status,
  propertyType: {
    id: propertyType.id,
    nameAr: propertyType.nameAr,
    nameEn: propertyType.nameEn,
    parent: propertyType.parent,
  },
  attachments: sql<{ id: number; url: string; fileType: string; mimeType: string }[]>`
    COALESCE(
      (
        SELECT json_agg(json_build_object(
          'id', ${attachments.id},
          'url', ${attachments.url},
          'fileType', ${attachments.fileType},
          'mimeType', ${attachments.mimeType}
        ))
        FROM ${attachments}
        WHERE ${attachments.attachableId} = ${listings.id}
          AND ${attachments.attachableType} = 'LISTING'
      ),
      '[]'
    )
  `.as('attachments'),
  developerPaymentMethods: listings.developerPaymentMethods,
  price: listings.price,
  spaceSqm: listings.spaceSqm,
  numberOfRooms: listings.numberOfRooms,
  numberOfBathrooms: listings.numberOfBathrooms,
  numberOfUnits: listings.numberOfUnits,
  mPrice: listings.mPrice,
  deliveryDate: listings.deliveryDate,
  deliveryReadiness: sql<ProjectPropertyDeliveryReadiness>`
    CASE
      WHEN ${listings.deliveryDate} IS NULL THEN 'NOT_READY'
      WHEN (${listings.deliveryDate})::timestamptz > NOW() THEN 'DELIVERING_SOON'
      ELSE 'READY_TO_DELIVER'
    END
  `.as('deliveryReadiness'),
  createdAt: listings.createdAt,
  updatedAt: listings.updatedAt,
  project: sql<DeveloperListingProjectShape | null>`
    CASE
      WHEN ${developersProjects.id} IS NOT NULL THEN json_build_object(
        'id', ${developersProjects.id},
        'nameEn', ${developersProjects.nameEn},
        'nameAr', ${developersProjects.nameAr},
        'phone', ${developersProjects.phone},
        'whatsappPhone', ${developersProjects.whatsappPhone},
        'latitude', ${developersProjects.latitude},
        'longitude', ${developersProjects.longitude},
        'addressEn', ${developersProjects.addressEn},
        'addressAr', ${developersProjects.addressAr},
        'city', CASE
          WHEN ${cities.id} IS NOT NULL THEN json_build_object(
            'id', ${cities.id},
            'nameEn', ${cities.nameEn},
            'nameAr', ${cities.nameAr}
          )
          ELSE NULL
        END,
        'area', CASE
          WHEN ${areas.id} IS NOT NULL THEN json_build_object(
            'id', ${areas.id},
            'nameEn', ${areas.nameEn},
            'nameAr', ${areas.nameAr}
          )
          ELSE NULL
        END
      )
      ELSE NULL
    END
  `.as('project'),
  developer: sql<DeveloperListingDeveloperShape | null>`
    CASE
      WHEN ${realEstateDevelopers.id} IS NOT NULL THEN json_build_object(
        'id', ${realEstateDevelopers.id},
        'nameEn', ${realEstateDevelopers.nameEn},
        'nameAr', ${realEstateDevelopers.nameAr},
        'logo', ${realEstateDevelopers.logo}
      )
      ELSE NULL
    END
  `.as('developer'),
} as const;
