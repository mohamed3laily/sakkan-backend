export interface NotifiableMeta {
  notifiableId: number | null;
  notifiableType: string | null;
}

export interface FcmPayload extends Record<string, string> {}
