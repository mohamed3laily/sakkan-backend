/**
 * Paymob transaction processed callback body (`type` is typically `TRANSACTION`).
 * HMAC uses `is_refunded` in the concatenation (not `is_refund`).
 */
export type PaymobWebhookPayload = {
  obj: {
    id: number;
    pending: boolean;
    amount_cents: number;
    success: boolean;
    is_auth: boolean;
    is_capture: boolean;
    is_standalone_payment: boolean;
    is_voided: boolean;
    /** Included in HMAC string (Paymob docs). Distinct from `is_refund`. */
    is_refunded: boolean;
    is_3d_secure: boolean;
    integration_id: number;
    profile_id: number;
    has_parent_transaction: boolean;
    order: {
      id: number;
      created_at: string;
      delivery_needed: boolean;
      merchant: { id: number };
      collector: null;
      amount_cents: number;
      shipping_data: null;
      currency: string;
      is_payment_locked: boolean;
      is_return: boolean;
      is_cancel: boolean;
      is_returned: boolean;
      is_partially_captured: boolean;
      special_reference: string;
      merchant_order_id: string;
    };
    currency: string;
    source_data: {
      pan: string;
      type: string;
      tenure: null;
      sub_type: string;
    };
    error_occured: boolean;
    refunded_amount_cents: number;
    captured_amount: number;
    merchant_commission: number;
    discount_details: unknown[];
    is_void: boolean;
    /** Present on some payloads; HMAC uses `is_refunded` instead. */
    is_refund?: boolean;
    data: Record<string, unknown>;
    transaction_processed_callback_responses: unknown[];
    owner: number;
    created_at: string;
  };
  type: string;
};

export type CreatePaymobOrderDto = {
  userId: number;
  amountEgp: number;
  paymentType: string;
  metadata: Record<string, unknown>;
};
