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

/**
 * HMAC segment for Paymob `order.id` (POST): nested `order`, scalar `order`, or top-level `order_id`
 * when Accept omits a nested order object on some flows.
 */
function orderIdForHmac(obj: Record<string, unknown>): unknown {
  const order = obj['order'];
  if (typeof order === 'number' || typeof order === 'string') {
    return order;
  }
  if (order && typeof order === 'object' && !Array.isArray(order) && 'id' in order) {
    return (order as { id: unknown }).id;
  }
  if (obj['order_id'] != null) {
    return obj['order_id'];
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
export function buildPostTransactionHmacConcatFromRaw(obj: any): string {
  const source = obj.source_data || {};
  const orderId =
    typeof obj.order === 'object'
      ? obj.order?.id
      : obj.order;

  const vals = [
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
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    orderId,
    obj.owner,
    obj.pending,
    source.pan,
    source.sub_type,
    source.type,
    obj.success,
  ];

  return vals
    .map(v => {
      if (v === null || v === undefined) return '';
      if (typeof v === 'boolean') return v ? 'true' : 'false';
      return String(v);
    })
    .join('');
}

/**
 * POST transaction processed callback: nested `obj` from JSON body.
 * Uses `obj.id` and `order.id` (or `order` as scalar when Paymob sends that shape).
 */
export function buildPostTransactionHmacConcatString(obj: PaymobWebhookPayload['obj']): string {
  return buildPostTransactionHmacConcatFromRaw(obj as unknown as Record<string, unknown>);
}

/**
 * Read a Paymob response-callback query value. Supports:
 * - Flat keys (`source_data.pan`) when the framework keeps them literal
 * - Nested objects from Express `qs` (`source_data: { pan, type, sub_type }`)
 */
function getQueryParam(query: Record<string, unknown>, key: string): string | undefined {
  const direct = query[key];
  if (direct !== undefined && direct !== null) {
    if (typeof direct === 'string') {
      return direct;
    }
    if (typeof direct === 'number' || typeof direct === 'boolean') {
      return String(direct);
    }
    if (Array.isArray(direct)) {
      const first = direct[0];
      if (first !== undefined && first !== null) {
        return String(first);
      }
    }
  }

  const dot = key.indexOf('.');
  if (dot > 0) {
    const parentKey = key.slice(0, dot);
    const childKey = key.slice(dot + 1);
    const parent = query[parentKey];
    if (parent && typeof parent === 'object' && !Array.isArray(parent)) {
      const child = (parent as Record<string, unknown>)[childKey];
      if (child !== undefined && child !== null) {
        return String(child as string | number | boolean);
      }
    }
  }
  return undefined;
}

/**
 * GET transaction response callback: query params (flat or nested via `qs`).
 * Uses `id` and `order_id` (Paymob docs); some samples use `order` for order id — accept both.
 */
export function buildGetTransactionHmacConcatString(
  query: Record<string, unknown>,
): string {
  const q = (k: string) => {
    const v = query[k];
    if (v === undefined || v === null) return '';
    if (Array.isArray(v)) return String(v[0] ?? '');
    return String(v);
  };

  const orderId = q('order_id') || q('order');

  const vals = [
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

  return vals.join('');
}
