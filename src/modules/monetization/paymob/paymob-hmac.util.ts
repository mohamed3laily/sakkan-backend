import type { PaymobWebhookPayload } from '../types';

/**
 * Paymob Accept **HMAC** (callbacks include an `hmac` query param on both POST processed and GET response callbacks).
 *
 * - **Algorithm:** HMAC-SHA-512 using your account secret key.
 * - **POST (processed):** Concatenate values from **`obj`** in the fixed key order (e.g. `amount_cents`, `created_at`, …, `order.id`, …, `success`); see link below.
 * - **GET (response):** Same logical segments from **flat** query keys (`id`, `order_id` / `order`, `source_data.pan`, …).
 * - **Compare** the hex digest to the `hmac` query value.
 *
 * @see https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/hmac-transaction-callback
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

/** `order` may be `{ id }` or a raw id on some callback shapes. */
function orderIdForHmac(obj: Record<string, unknown>): unknown {
  const order = obj['order'];
  if (typeof order === 'number' || typeof order === 'string') {
    return order;
  }
  if (order && typeof order === 'object' && !Array.isArray(order) && 'id' in order) {
    return (order as { id: unknown }).id;
  }
  return undefined;
}

/** Resolve Paymob order id for DB lookup / logging (same rules as HMAC `order.id` segment). */
export function paymobOrderIdFromTransactionObj(obj: Record<string, unknown>): string | null {
  const id = orderIdForHmac(obj);
  if (id === undefined || id === null) {
    return null;
  }
  return String(id);
}

/**
 * POST transaction processed callback: transaction object (`payload.obj`) as plain JSON.
 * Reads fields loosely so minor payload shape differences still match Paymob’s concat rules.
 */
export function buildPostTransactionHmacConcatFromRaw(obj: Record<string, unknown>): string {
  const sourceRaw = obj['source_data'];
  const source =
    sourceRaw && typeof sourceRaw === 'object' && !Array.isArray(sourceRaw)
      ? (sourceRaw as Record<string, unknown>)
      : null;

  const isRefunded = obj['is_refunded'] ?? obj['is_refund'];

  const segments: unknown[] = [
    obj['amount_cents'],
    obj['created_at'],
    obj['currency'],
    obj['error_occured'],
    obj['has_parent_transaction'],
    obj['id'],
    obj['integration_id'],
    obj['is_3d_secure'],
    obj['is_auth'],
    obj['is_capture'],
    isRefunded ?? false,
    obj['is_standalone_payment'],
    obj['is_voided'],
    orderIdForHmac(obj),
    obj['owner'],
    obj['pending'],
    source?.['pan'],
    source?.['sub_type'],
    source?.['type'],
    obj['success'],
  ];
  return segments.map(hmacSegment).join('');
}

/**
 * POST transaction processed callback: nested `obj` from JSON body.
 * Uses `obj.id` and `order.id` (or `order` as scalar when Paymob sends that shape).
 */
export function buildPostTransactionHmacConcatString(obj: PaymobWebhookPayload['obj']): string {
  return buildPostTransactionHmacConcatFromRaw(obj as unknown as Record<string, unknown>);
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
    q('is_refunded') ?? q('is_refund'),
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
