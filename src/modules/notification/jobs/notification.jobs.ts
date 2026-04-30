export type DispatchPreferenceMatchPayload = {
  type: 'LISTING_PREFERENCE_MATCH';
  listingId: number;
  cityId: number;
  cityName: string;
  areaIds: number[];
  propertyTypeId: number;
};

export type DispatchSeriousListingPayload = {
  type: 'SERIOUS_LISTING_CREATED';
  listingId: number;
  cityName: string;
  listingType: string;
};

export type DispatchListingRequestPayload = {
  type: 'LISTING_REQUEST_RECEIVED';
  listingId: number;
  agentId: number;
  requesterUserId: number;
};

export type NotificationJobPayload =
  | DispatchPreferenceMatchPayload
  | DispatchSeriousListingPayload
  | DispatchListingRequestPayload;
