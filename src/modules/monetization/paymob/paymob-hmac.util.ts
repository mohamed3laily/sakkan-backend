import type { PaymobWebhookPayload } from '../types';

/**
 * Paymob HMAC: concatenate values in fixed order (see Paymob transaction callback docs).
 * https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/transaction-callbacks
 */
function hmacSegment(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }
  return '';
}

/**
 * POST transaction processed callback: nested `obj` from JSON body.
 * Uses `obj.id` and `obj.order.id` (not `order_id`).
 */
export function buildPostTransactionHmacConcatString(obj: PaymobWebhookPayload['obj']): string {
  const order = obj.order;
  const source = obj.source_data ?? { pan: '', sub_type: '', type: '' };
  const segments: unknown[] = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded ?? false,
    obj.is_standalone_payment,
    obj.is_voided,
    order?.id,
    obj.owner,
    obj.pending,
    source.pan,
    source.sub_type,
    source.type,
    obj.success,
  ];
  return segments.map(hmacSegment).join('');
}

/**
 * GET transaction response callback: flat query params.
 * Uses `id` and `order_id` (Paymob docs); some samples use `order` for order id — accept both.
 */
export function buildGetTransactionHmacConcatString(
  query: Record<string, string | string[] | undefined>,
): string {
  const q = (key: string): string | undefined => {
    const v = query[key];
    if (v === undefined) {
      return undefined;
    }
    return Array.isArray(v) ? v[0] : v;
  };

  const orderId = q('order_id') ?? q('order');

  const segments: unknown[] = [
    q('amount_cents'),
    q('created_at'),
    q('currency'),
    q('error_occured'),
    q('has_parent_transaction'),
    q('id'),
    q('integration_id'),
    q('is_3d_secure'),
    q('is_auth'),
    q('is_capture'),
    q('is_refunded'),
    q('is_standalone_payment'),
    q('is_voided'),
    orderId,
    q('owner'),
    q('pending'),
    q('source_data.pan'),
    q('source_data.sub_type'),
    q('source_data.type'),
    q('success'),
  ];
  return segments.map(hmacSegment).join('');
}
