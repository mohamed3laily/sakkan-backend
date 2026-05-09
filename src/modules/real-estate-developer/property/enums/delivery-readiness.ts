export const ProjectPropertyDeliveryReadiness = {
  NOT_READY: 'NOT_READY',
  DELIVERING_SOON: 'DELIVERING_SOON',
  READY_TO_DELIVER: 'READY_TO_DELIVER',
} as const;

export type ProjectPropertyDeliveryReadiness =
  (typeof ProjectPropertyDeliveryReadiness)[keyof typeof ProjectPropertyDeliveryReadiness];
