export const DealType = {
  RENT: 'RENT',
  BUY: 'BUY',
} as const;

export type DealType = (typeof DealType)[keyof typeof DealType];

export const ListingType = {
  OFFER: 'OFFER',
  REQUEST: 'REQUEST',
} as const;

export type ListingType = (typeof ListingType)[keyof typeof ListingType];

export const PropertyType = {
  LAND: 'LAND',
  VILLA_PALACE: 'VILLA_PALACE',
  FLOOR: 'FLOOR',
  BUILDING_TOWER: 'BUILDING_TOWER',
  APARTMENT_ROOM: 'APARTMENT_ROOM',
} as const;

export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const BudgetType = {
  MARKET: 'MARKET',
  FIXED: 'FIXED',
} as const;

export type BudgetType = (typeof BudgetType)[keyof typeof BudgetType];

export const PaymentMethod = {
  CASH: 'CASH',
  OTHER: 'OTHER',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
