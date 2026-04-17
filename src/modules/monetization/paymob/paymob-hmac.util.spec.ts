import type { PaymobWebhookPayload } from '../types';

import {
  buildGetTransactionHmacConcatString,
  buildPostTransactionHmacConcatString,
} from './paymob-hmac.util';

/** Paymob docs sample concatenation (transaction processed callback). */
const PAYMOB_DOC_SAMPLE_CONCAT =
  '1000002024-06-13T11:33:44.592345EGPfalsefalse1920364654097558truefalsefalsefalsetruefalse217503754302852false2346MasterCardcardtrue';

describe('paymob-hmac.util', () => {
  it('buildPostTransactionHmacConcatString matches Paymob documentation sample string', () => {
    const obj: PaymobWebhookPayload['obj'] = {
      id: 192036465,
      pending: false,
      amount_cents: 100000,
      success: true,
      is_auth: false,
      is_capture: false,
      is_standalone_payment: true,
      is_voided: false,
      is_refunded: false,
      is_3d_secure: true,
      integration_id: 4097558,
      profile_id: 164295,
      has_parent_transaction: false,
      order: {
        id: 217503754,
        created_at: '2022-01-01',
        delivery_needed: false,
        merchant: { id: 164295 },
        collector: null,
        amount_cents: 100000,
        shipping_data: null,
        currency: 'EGP',
        is_payment_locked: false,
        is_return: false,
        is_cancel: false,
        is_returned: false,
        is_partially_captured: false,
        special_reference: '',
        merchant_order_id: '',
      },
      currency: 'EGP',
      source_data: {
        pan: '2346',
        type: 'card',
        tenure: null,
        sub_type: 'MasterCard',
      },
      error_occured: false,
      refunded_amount_cents: 0,
      captured_amount: 0,
      merchant_commission: 0,
      discount_details: [],
      is_void: false,
      is_refund: false,
      data: {},
      transaction_processed_callback_responses: [],
      owner: 302852,
      created_at: '2024-06-13T11:33:44.592345',
    };

    expect(buildPostTransactionHmacConcatString(obj)).toBe(PAYMOB_DOC_SAMPLE_CONCAT);
  });

  it('buildPostTransactionHmacConcatString uses is_refunded for the HMAC segment (not is_refund)', () => {
    const base: PaymobWebhookPayload['obj'] = {
      id: 1,
      pending: false,
      amount_cents: 100,
      success: true,
      is_auth: false,
      is_capture: false,
      is_standalone_payment: true,
      is_voided: false,
      is_refunded: true,
      is_3d_secure: false,
      integration_id: 1,
      profile_id: 1,
      has_parent_transaction: false,
      order: {
        id: 2,
        created_at: 'x',
        delivery_needed: false,
        merchant: { id: 1 },
        collector: null,
        amount_cents: 100,
        shipping_data: null,
        currency: 'EGP',
        is_payment_locked: false,
        is_return: false,
        is_cancel: false,
        is_returned: false,
        is_partially_captured: false,
        special_reference: '',
        merchant_order_id: '',
      },
      currency: 'EGP',
      source_data: { pan: '', type: '', tenure: null, sub_type: '' },
      error_occured: false,
      refunded_amount_cents: 0,
      captured_amount: 0,
      merchant_commission: 0,
      discount_details: [],
      is_void: false,
      is_refund: false,
      data: {},
      transaction_processed_callback_responses: [],
      owner: 1,
      created_at: '2020-01-01',
    };

    const withRefundedTrue = buildPostTransactionHmacConcatString(base);
    const withRefundedFalse = buildPostTransactionHmacConcatString({
      ...base,
      is_refunded: false,
      is_refund: true,
    });

    expect(withRefundedTrue).not.toBe(withRefundedFalse);
  });

  it('buildGetTransactionHmacConcatString matches POST string when using flat query with order_id', () => {
    const query: Record<string, string> = {
      amount_cents: '100000',
      created_at: '2024-06-13T11:33:44.592345',
      currency: 'EGP',
      error_occured: 'false',
      has_parent_transaction: 'false',
      id: '192036465',
      integration_id: '4097558',
      is_3d_secure: 'true',
      is_auth: 'false',
      is_capture: 'false',
      is_refunded: 'false',
      is_standalone_payment: 'true',
      is_voided: 'false',
      order_id: '217503754',
      owner: '302852',
      pending: 'false',
      'source_data.pan': '2346',
      'source_data.sub_type': 'MasterCard',
      'source_data.type': 'card',
      success: 'true',
    };

    expect(buildGetTransactionHmacConcatString(query)).toBe(PAYMOB_DOC_SAMPLE_CONCAT);
  });

  it('buildGetTransactionHmacConcatString accepts order as alias for order_id', () => {
    const query: Record<string, string> = {
      amount_cents: '100000',
      created_at: '2024-06-13T11:33:44.592345',
      currency: 'EGP',
      error_occured: 'false',
      has_parent_transaction: 'false',
      id: '192036465',
      integration_id: '4097558',
      is_3d_secure: 'true',
      is_auth: 'false',
      is_capture: 'false',
      is_refunded: 'false',
      is_standalone_payment: 'true',
      is_voided: 'false',
      order: '217503754',
      owner: '302852',
      pending: 'false',
      'source_data.pan': '2346',
      'source_data.sub_type': 'MasterCard',
      'source_data.type': 'card',
      success: 'true',
    };

    expect(buildGetTransactionHmacConcatString(query)).toBe(PAYMOB_DOC_SAMPLE_CONCAT);
  });
});
