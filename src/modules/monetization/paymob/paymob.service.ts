import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { eq } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { payments } from '../../db/schemas/monetization/payments';
import type { AppTransaction } from '../monetization-db.types';
import {
  buildGetTransactionHmacConcatString,
  buildPostTransactionHmacConcatFromRaw,
} from './paymob-hmac.util';

export type PaymobCheckoutFlow = 'intention' | 'legacy_iframe';

export type PaymobOrderResult = {
  paymobOrderId: string;
  /** Stored on `payments.paymob_payment_key`; Intention: `client_secret`. */
  paymentKey: string;
  paymentUrl: string;
  internalPaymentId: number;
  /** Flutter `paymob` SDK: `Paymob.pay(publicKey:, clientSecret:)` — same as Intention `client_secret`. */
  clientSecret: string;
  /** Flutter / Unified Checkout — `null` when legacy iframe-only and no public key configured. */
  publicKey: string | null;
  /** `intention`: prefer native SDK + optional WebView with `paymentUrl`; `legacy_iframe`: WebView `paymentUrl` only (token is not an Intention secret). */
  checkoutFlow: PaymobCheckoutFlow;
};

type CreateOrderParams = {
  userId: number;
  amountEgp: number;
  paymentType: (typeof payments.$inferInsert)['type'];
  metadata: Record<string, unknown>;
  billingData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

type PaymentRow = typeof payments.$inferSelect;

@Injectable()
export class PaymobService {
  private readonly logger = new Logger(PaymobService.name);
  private readonly apiKey: string;
  private readonly integrationId: string;
  private readonly iframeId: string;
  /** Accept **Secret Key** (`PAYMOB_SECRET_KEY`): Intention / legacy API `Authorization: Token …` (not used for callback HMAC; that uses `PAYMOB_HMAC_SECRET` only). */
  private readonly secretKey: string;
  private readonly publicKey: string | undefined;
  private readonly useIntention: boolean;
  private readonly acceptHost: string;
  private readonly legacyApiBase: string;
  /**
   * Transaction callback HMAC (POST processed + GET response): SHA-512 over Paymob’s concat string using **`PAYMOB_HMAC_SECRET` only** ([docs](https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/hmac-transaction-callback)).
   */
  private readonly webhookHmacSecrets: readonly string[];
  private readonly webhookHmacSecretLabels: readonly string[];

  constructor(
    private readonly config: ConfigService,
    private readonly drizzle: DrizzleService,
  ) {
    this.integrationId = this.config.getOrThrow('PAYMOB_INTEGRATION_ID');
    this.acceptHost =
      this.config.get<string>('PAYMOB_ACCEPT_HOST')?.replace(/\/$/, '') ??
      'https://accept.paymob.com';
    this.legacyApiBase = `${this.acceptHost}/api`;

    this.secretKey = this.config.getOrThrow<string>('PAYMOB_SECRET_KEY').trim();
    this.publicKey = this.config.get<string>('PAYMOB_PUBLIC_KEY')?.trim();
    this.useIntention = Boolean(this.publicKey);

    if (this.useIntention) {
      this.apiKey = '';
      this.iframeId = '';
    } else {
      this.apiKey = this.config.getOrThrow('PAYMOB_API_KEY');
      this.iframeId = this.config.getOrThrow('PAYMOB_IFRAME_ID');
    }

    const hmacSecret = (
      this.config.get<string>('PAYMOB_HMAC_SECRET') ||
      process.env.PAYMOB_HMAC_SECRET ||
      ''
    ).trim();
    if (hmacSecret.length === 0) {
      throw new Error(
        'PAYMOB_HMAC_SECRET is required and must be non-empty (Accept HMAC secret for transaction callbacks).',
      );
    }

    this.webhookHmacSecrets = [hmacSecret];
    this.webhookHmacSecretLabels = ['PAYMOB_HMAC_SECRET'];

    this.logger.log('Paymob transaction callback HMAC uses PAYMOB_HMAC_SECRET only (SHA-512).');
  }

  async createOrder(params: CreateOrderParams): Promise<PaymobOrderResult> {
    const amountPiasters = params.amountEgp * 100;

    const [internalPayment] = await this.drizzle.db
      .insert(payments)
      .values({
        userId: params.userId,
        type: params.paymentType,
        status: 'pending',
        amountPiasters,
        metadata: params.metadata,
      })
      .returning();

    try {
      if (this.useIntention) {
        return await this.createPaymentIntention(params, internalPayment, amountPiasters);
      }
      return await this.createOrderLegacy(params, internalPayment, amountPiasters);
    } catch (err) {
      await this.drizzle.db
        .update(payments)
        .set({ status: 'failed', updatedAt: new Date().toISOString() })
        .where(eq(payments.id, internalPayment.id));

      this.logger.error('Paymob order creation failed', err);
      throw new InternalServerErrorException('PAYMENT_GATEWAY_ERROR');
    }
  }

  /**
   * Paymob Intention API (Unified Checkout). See Create Intention docs.
   * Requires PAYMOB_SECRET_KEY, PAYMOB_PUBLIC_KEY, and callback URLs (or APP_PUBLIC_URL).
   */
  private async createPaymentIntention(
    params: CreateOrderParams,
    internalPayment: PaymentRow,
    amountPiasters: number,
  ): Promise<PaymobOrderResult> {
    const notificationUrl = this.resolveNotificationUrl();
    const redirectionUrl = this.resolveRedirectionUrl();

    const intentionUrl = `${this.acceptHost}/v1/intention/`;
    const body = {
      amount: amountPiasters,
      currency: 'EGP',
      payment_methods: [Number(this.integrationId)],
      items: [
        {
          name: this.labelForPaymentType(params.paymentType),
          amount: amountPiasters,
          description: `Sakkan ${params.paymentType}`,
          quantity: 1,
        },
      ],
      billing_data: {
        apartment: 'NA',
        first_name: params.billingData.firstName,
        last_name: params.billingData.lastName,
        street: 'NA',
        building: 'NA',
        phone_number: params.billingData.phone,
        city: 'NA',
        country: 'EG',
        email: params.billingData.email,
        floor: 'NA',
        state: 'NA',
      },
      extras: { internal_payment_id: internalPayment.id },
      special_reference: String(internalPayment.id),
      expiration: 3600,
      notification_url: notificationUrl,
      redirection_url: redirectionUrl,
    };

    const res = await fetch(intentionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const rawText = await res.text();
    if (!res.ok) {
      this.logger.error(`Paymob intention failed: ${res.status} ${rawText}`);
      throw new Error(`Paymob intention failed: ${res.status}`);
    }

    let json: {
      client_secret?: string;
      intention_order_id?: number;
      id?: string;
    };
    try {
      json = JSON.parse(rawText) as typeof json;
    } catch {
      this.logger.error(`Paymob intention: invalid JSON ${rawText}`);
      throw new Error('Paymob intention: invalid response');
    }

    const clientSecret = json.client_secret;
    const intentionOrderId = json.intention_order_id;

    if (!clientSecret || intentionOrderId == null) {
      this.logger.error(`Paymob intention: missing fields ${rawText}`);
      throw new Error('Paymob intention: missing client_secret or intention_order_id');
    }

    await this.drizzle.db
      .update(payments)
      .set({
        paymobOrderId: String(intentionOrderId),
        paymobPaymentKey: clientSecret,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(payments.id, internalPayment.id));

    const paymentUrl = `${this.acceptHost}/unifiedcheckout/?publicKey=${encodeURIComponent(this.publicKey!)}&clientSecret=${encodeURIComponent(clientSecret)}`;

    return {
      paymobOrderId: String(intentionOrderId),
      paymentKey: clientSecret,
      paymentUrl,
      internalPaymentId: internalPayment.id,
      clientSecret,
      publicKey: this.publicKey ?? null,
      checkoutFlow: 'intention',
    };
  }

  /** Legacy Accept API: auth token + ecommerce order + payment_keys + iframe. */
  private async createOrderLegacy(
    params: CreateOrderParams,
    internalPayment: PaymentRow,
    amountPiasters: number,
  ): Promise<PaymobOrderResult> {
    const authRes = await fetch(`${this.legacyApiBase}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: this.apiKey }),
    });
    if (!authRes.ok) {
      throw new Error(`Paymob auth failed: ${authRes.status}`);
    }
    const authJson = (await authRes.json()) as { token?: string };
    const authToken = authJson.token;
    if (!authToken) {
      throw new Error('Paymob auth: missing token');
    }

    const orderRes = await fetch(`${this.legacyApiBase}/ecommerce/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountPiasters,
        currency: 'EGP',
        merchant_order_id: String(internalPayment.id),
        items: [],
      }),
    });
    if (!orderRes.ok) {
      throw new Error(`Paymob order failed: ${orderRes.status}`);
    }
    const paymobOrder = (await orderRes.json()) as { id?: number };
    if (paymobOrder.id == null) {
      throw new Error('Paymob order: missing id');
    }

    const keyRes = await fetch(`${this.legacyApiBase}/acceptance/payment_keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: amountPiasters,
        expiration: 3600,
        order_id: paymobOrder.id,
        billing_data: {
          apartment: 'NA',
          email: params.billingData.email,
          floor: 'NA',
          first_name: params.billingData.firstName,
          street: 'NA',
          building: 'NA',
          phone_number: params.billingData.phone,
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'NA',
          country: 'EG',
          last_name: params.billingData.lastName,
          state: 'NA',
        },
        currency: 'EGP',
        integration_id: Number(this.integrationId),
      }),
    });
    if (!keyRes.ok) {
      throw new Error(`Paymob payment_keys failed: ${keyRes.status}`);
    }
    const keyJson = (await keyRes.json()) as { token?: string };
    const paymentKey = keyJson.token;
    if (!paymentKey) {
      throw new Error('Paymob payment_keys: missing token');
    }

    await this.drizzle.db
      .update(payments)
      .set({
        paymobOrderId: String(paymobOrder.id),
        paymobPaymentKey: paymentKey,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(payments.id, internalPayment.id));

    const paymentUrl = `${this.acceptHost}/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`;

    return {
      paymobOrderId: String(paymobOrder.id),
      paymentKey,
      paymentUrl,
      internalPaymentId: internalPayment.id,
      clientSecret: paymentKey,
      publicKey: this.publicKey ?? null,
      checkoutFlow: 'legacy_iframe',
    };
  }

  private resolveNotificationUrl(): string {
    const explicit = this.config.get<string>('PAYMOB_NOTIFICATION_URL');
    if (explicit) {
      return explicit;
    }
    const app = this.config.get<string>('APP_PUBLIC_URL');
    if (!app) {
      throw new Error(
        'Paymob Intention requires PAYMOB_NOTIFICATION_URL or APP_PUBLIC_URL (for /v1/payments/paymob-webhook)',
      );
    }
    return `${app.replace(/\/$/, '')}/v1/payments/paymob-webhook`;
  }

  private resolveRedirectionUrl(): string {
    const explicit = this.config.get<string>('PAYMOB_REDIRECT_URL');
    if (explicit) {
      return explicit;
    }
    const app = this.config.get<string>('APP_PUBLIC_URL');
    if (!app) {
      throw new Error(
        'Paymob Intention requires PAYMOB_REDIRECT_URL or APP_PUBLIC_URL (for /v1/payments/paymob-return)',
      );
    }
    return `${app.replace(/\/$/, '')}/v1/payments/paymob-return`;
  }

  private labelForPaymentType(paymentType: CreateOrderParams['paymentType']): string {
    const labels: Record<CreateOrderParams['paymentType'], string> = {
      subscription: 'Subscription',
      serious_request: 'Serious listing credit',
      featured_single: 'Featured listing credit',
      featured_bundle: 'Featured bundle',
    };
    return labels[paymentType];
  }

  verifyWebhookHmac(payload: unknown, hmac: string): boolean {
    if (!hmac?.trim()) {
      this.logger.warn(
        'Paymob HMAC POST: missing or empty ?hmac= query param. Paymob appends hmac to the callback URL.',
      );
      return false;
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      this.logger.warn('Paymob HMAC POST: body is not a JSON object');
      return false;
    }

    const body = payload as Record<string, unknown>;
    const objRaw = body['obj'];
    if (!objRaw || typeof objRaw !== 'object' || Array.isArray(objRaw)) {
      this.logger.warn('Paymob HMAC POST: payload.obj is missing or not an object');
      return false;
    }

    const obj = objRaw as Record<string, unknown>;
    const orderField = obj['order'];
    const orderId =
      typeof orderField === 'object' &&
      orderField !== null &&
      !Array.isArray(orderField) &&
      'id' in orderField
        ? Number((orderField as { id: unknown }).id)
        : typeof orderField === 'number'
          ? orderField
          : undefined;
    const txnId = obj['id'];
    const integrationId = obj['integration_id'];

    const concatenated = buildPostTransactionHmacConcatFromRaw(obj);
    this.logger.debug(
      `Paymob HMAC POST: txn=${String(txnId)} order=${String(orderId)} integration_id=${String(integrationId)} concatLen=${concatenated.length} amount_cents=${String(obj['amount_cents'])} is_refunded=${String(obj['is_refunded'])} is_refund=${String(obj['is_refund'])} has_source_data=${Boolean(obj['source_data'])}`,
    );

    return this.verifyTransactionCallbackHmacDigest(concatenated, hmac.trim(), 'POST', {
      orderId: Number.isFinite(orderId) ? orderId : undefined,
      txnId: typeof txnId === 'number' ? txnId : undefined,
      integrationId: typeof integrationId === 'number' ? integrationId : undefined,
    });
  }

  /**
   * GET transaction response callback (browser redirect). Same HMAC algorithm; keys are flat (`id`, `order_id` or `order`).
   */
  verifyResponseCallbackHmac(query: Record<string, string | string[] | undefined>): boolean {
    const raw = query['hmac'];
    const hmac = Array.isArray(raw) ? raw[0] : raw;
    if (!hmac || typeof hmac !== 'string') {
      this.logger.warn(
        'Paymob HMAC GET (return URL): missing hmac in query — redirect callbacks must include Paymob query params.',
      );
      return false;
    }

    const qVal = (key: string): string | undefined => {
      const v = query[key];
      if (v === undefined) {
        return undefined;
      }
      return Array.isArray(v) ? v[0] : v;
    };

    const concatenated = buildGetTransactionHmacConcatString(query);
    const orderRaw = qVal('order_id') ?? qVal('order');
    const txnRaw = qVal('id');
    const integRaw = qVal('integration_id');
    const orderId = orderRaw !== undefined ? Number(orderRaw) : undefined;
    const txnId = txnRaw !== undefined ? Number(txnRaw) : undefined;
    const integrationId = integRaw !== undefined ? Number(integRaw) : undefined;

    this.logger.debug(
      `Paymob HMAC GET: txn=${txnId} order=${orderId} integration_id=${integrationId} concatLen=${concatenated.length}`,
    );

    return this.verifyTransactionCallbackHmacDigest(concatenated, hmac.trim(), 'GET', {
      orderId: Number.isFinite(orderId) ? orderId : undefined,
      txnId: Number.isFinite(txnId) ? txnId : undefined,
      integrationId: Number.isFinite(integrationId) ? integrationId : undefined,
    });
  }

  private verifyTransactionCallbackHmacDigest(
    concatenated: string,
    receivedHmac: string,
    context: 'POST' | 'GET',
    meta?: { orderId?: number; txnId?: number; integrationId?: number },
  ): boolean {
    const normalizedReceived = receivedHmac.trim().toLowerCase();
    const expectedHexLen = 128;

    if (normalizedReceived.length !== expectedHexLen) {
      this.logger.warn(
        `Paymob HMAC ${context} failed: received digest length=${normalizedReceived.length} (expect ${expectedHexLen} for SHA-512 hex) order=${meta?.orderId} txn=${meta?.txnId}`,
      );
      return false;
    }

    for (let i = 0; i < this.webhookHmacSecrets.length; i++) {
      const secret = this.webhookHmacSecrets[i];
      for (const keyMaterial of this.hmacKeyVariants(secret)) {
        const computed = crypto
          .createHmac('sha512', keyMaterial)
          .update(concatenated)
          .digest('hex')
          .toLowerCase();

        if (computed.length !== normalizedReceived.length) {
          continue;
        }

        try {
          if (
            crypto.timingSafeEqual(
              Buffer.from(computed, 'hex'),
              Buffer.from(normalizedReceived, 'hex'),
            )
          ) {
            return true;
          }
        } catch {
          /* invalid hex — try next variant */
        }
      }
    }

    const primarySecret = this.webhookHmacSecrets[0];
    const firstComputed = primarySecret
      ? crypto
          .createHmac('sha512', this.hmacKeyVariants(primarySecret)[0])
          .update(concatenated)
          .digest('hex')
          .toLowerCase()
      : '';

    const cfgInt = this.integrationId;
    const payloadInt = meta?.integrationId;
    this.logger.warn(
      `Paymob HMAC ${context} mismatch (PAYMOB_HMAC_SECRET): order=${meta?.orderId} txn=${meta?.txnId} payloadIntegration=${payloadInt} PAYMOB_INTEGRATION_ID=${cfgInt} concatLen=${concatenated.length} hmacSecretChars=${primarySecret?.length ?? 0} computedPrefix=${firstComputed.slice(0, 16)} receivedPrefix=${normalizedReceived.slice(0, 16)}`,
    );
    if (payloadInt !== undefined && String(payloadInt) !== String(cfgInt)) {
      this.logger.warn(
        `Paymob HMAC: payload integration_id (${payloadInt}) !== PAYMOB_INTEGRATION_ID (${cfgInt}). Use test/live keys from the same Accept mode.`,
      );
    } else {
      this.logger.warn(
        'Paymob HMAC: confirm PAYMOB_HMAC_SECRET matches the HMAC secret from Accept (same test/live mode as the integration) and the callback concat matches Paymob docs.',
      );
    }

    return false;
  }

  /** Dashboard hex HMAC keys: try UTF-8 string and, for even-length hex, decoded bytes. */
  private hmacKeyVariants(secret: string): readonly (string | Buffer)[] {
    const variants: (string | Buffer)[] = [secret];
    const t = secret.trim();
    if (/^[0-9a-fA-F]+$/.test(t) && t.length >= 2 && t.length % 2 === 0) {
      try {
        const buf = Buffer.from(t, 'hex');
        if (buf.length > 0) {
          variants.push(buf);
        }
      } catch {
        /* ignore invalid hex */
      }
    }
    return variants;
  }

  async findPaymentByPaymobOrder(paymobOrderId: string) {
    const rows = await this.drizzle.db
      .select()
      .from(payments)
      .where(eq(payments.paymobOrderId, paymobOrderId))
      .limit(1);
    return rows[0] ?? null;
  }

  async markPaymentSuccess(paymentId: number, paymobTransactionId: string) {
    await this.drizzle.db
      .update(payments)
      .set({
        status: 'success',
        paymobTransactionId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(payments.id, paymentId));
  }

  /**
   * Locks the payment row (`FOR UPDATE`), runs fulfillment on `pending` only, then sets `success`
   * in the same DB transaction. If `run` throws, the payment stays `pending` so Paymob can retry.
   * Duplicate webhooks see non-pending status and skip `run` (no double credits).
   */
  async finalizePendingPaymentWithFulfillment(
    paymentId: number,
    paymobTransactionId: string,
    run: (tx: AppTransaction) => Promise<void>,
  ): Promise<void> {
    await this.drizzle.db.transaction(async (tx) => {
      const rows = await tx.select().from(payments).where(eq(payments.id, paymentId)).for('update');
      const p = rows[0];
      if (!p || p.status !== 'pending') {
        this.logger.log(
          `Payment ${paymentId} skip fulfill (status=${p?.status ?? 'missing'}) — already handled`,
        );
        return;
      }

      await run(tx);

      await tx
        .update(payments)
        .set({
          status: 'success',
          paymobTransactionId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(payments.id, paymentId));
    });
  }

  async markPaymentFailed(paymentId: number) {
    await this.drizzle.db
      .update(payments)
      .set({ status: 'failed', updatedAt: new Date().toISOString() })
      .where(eq(payments.id, paymentId));
  }
}
