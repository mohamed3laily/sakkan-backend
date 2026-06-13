# Monetization (Sakkan backend)

This document describes how subscriptions, quotas, one-time credits, listing tiers, **Paymob** payments, and **Apple In-App Purchase (iOS)** work in code. API paths assume URI versioning **`/v1`** (see [`main.ts`](../src/main.ts)).

---

## Concepts

| Concept | Meaning |
|--------|---------|
| **Listing tier** | `standard` (default) or `premium`. Premium is time-boxed (`premium_expires_at`, **15 days** from promotion; see [`listing.repo.ts`](../src/modules/listing/listing.repo.ts) `PREMIUM_EXPIRY_DAYS`). |
| **Listing type** | `OFFER` (seller/property offer) vs `REQUEST` (buyer serious request). Monetization rules differ. |
| **Subscription** | Active plan on `user_subscriptions` with monthly **featured ad quota** and **serious-request view quota** (see plan columns). Also defines **device_limit** for concurrent mobile sessions. |
| **One-time credits** | Wallet rows in `one_time_credits`: one row per `(user_id, credit type)` where `type` is `featured` or `serious`. Balance = `total_credits - used_credits`. |
| **Credit products** | Sellable SKUs in `credit_products` (key, price, credit type, pack size). Checkout reads product by key. Optional `apple_product_id` for iOS IAP. |
| **Subscription plans** | Rows in `subscription_plans`. Paymob checkout uses `plan_id`; iOS IAP uses `apple_product_id` matched to App Store product IDs. |
| **Quota usage** | Per user per **billing month** (`quota_usage`): `featured_ad_used`, `serious_request_views_used`. Billing month is derived from subscription period (see `QuotaService.getCurrentBillingMonth`). |

**Important split:** **Publishing** a premium REQUEST uses **serious credits** only. **Viewing** (revealing) another user’s serious REQUEST uses **subscription serious-request view quota** (and `serious_request_unlocks`), not serious credits.

---

## Listing tiers and promotion

- Schema: [`listing.ts`](../src/modules/db/schemas/listing/listing.ts) — `listing_tier`, `premium_expires_at`, `monetization_payment_id`, `quota_source` (`subscription` \| `credits`).
- **Premium promotion** is implemented in [`ListingPromotionService`](../src/modules/monetization/listing-promotion/listing-promotion.service.ts):

| `listingType` | What “premium” means | Deduction | `quota_source` on listing |
|---------------|------------------------|-----------|---------------------------|
| `OFFER` | Featured-style offer | Subscription **featured** quota first; if exhausted, **featured** credits | `subscription` or `credits` |
| `REQUEST` | Serious request | **Serious** credits only | `credits` |

- **Create listing + premium (atomic):** [`ListingService.createListing`](../src/modules/listing/listing.service.ts) with `makePremium === true` runs a **single DB transaction**: insert listing → `promoteToPremiumInTransaction`. If promotion fails (e.g. `NO_QUOTA_OR_CREDITS`), the insert is rolled back.
- **Paymob-only promote:** After payment, [`promoteToPremiumByPayment(InTx)`](../src/modules/monetization/listing-promotion/listing-promotion.service.ts) sets tier to premium and links `monetization_payment_id`; it does **not** deduct credits again (credits are granted separately in fulfillment when applicable).

---

## Quota service ([`quota.service.ts`](../src/modules/monetization/quota/quota.service.ts))

### Featured publish (`OFFER` → premium)

1. **`checkFeaturedPublish`** — read-only: can user publish featured at all? Combines plan remaining featured slots + featured credit balance.
2. **`checkAndDeductForFeaturedPublish` / `*Tx`** — transactional: if active subscription has remaining `featuredAdQuotaPerMonth` for current billing month, increment `quota_usage.featured_ad_used`; else consume **one featured credit** (`used_credits + 1`). Throws **`ConflictException('NO_QUOTA_OR_CREDITS')`** if neither is available.

### Serious request **publish** (`REQUEST` → premium)

- **`checkAndDeductForSeriousRequestPublish` / `*Tx`** — **serious credits only** (no subscription gate). Consumes one serious credit or throws **`NO_QUOTA_OR_CREDITS`** (`NO_CREDITS` path uses the same exception type in serious publish branch).

### Serious request **view** (reveal contact)

- **`checkSeriousRequestView`** — read-only: needs active subscription and remaining `seriousRequestViewsQuotaPerMonth`.
- **`checkAndDeductForSeriousRequestView`** — if this user already has a row in **`serious_request_unlocks`** for this listing, **no charge** (re-reveal free). Otherwise increments `serious_request_views_used` for the billing month and inserts **`serious_request_unlocks`**. Errors: `NO_SUBSCRIPTION`, `VIEW_QUOTA_EXHAUSTED`.

---

## Credits ([`credits.service.ts`](../src/modules/monetization/credits/credits.service.ts))

- **`getProduct(key)`** — active row from `credit_products`; `NotFoundException` if missing/inactive.
- **`getActiveProducts()`** — public catalog for clients (e.g. `GET /v1/subscriptions/credit-products`).
- **`addCredits` / `addCreditsTx`** — upsert on **`(user_id, type)`**; requires DB **unique constraint** `one_time_credits_user_type_unique` (see migration `0039` / repair migrations if missing).
- **`getBalance` / `getAllBalances`** — derived available credits.

---

## Subscription checkout and wallet

- **Plans:** `GET /v1/subscriptions/plans` (public).
- **Subscribe (Paymob):** `POST /v1/subscriptions/subscribe` — creates Paymob Intention order, metadata includes `plan_id`; webhook activates subscription via [`SubscriptionService.activateSubscription`](../src/modules/monetization/subscription/subscription.service.ts). Optional body `paymentMethod`: `card` (default) or `wallet` (mobile wallet SDK; `paymentUrl` is `null` in response).
- **Subscribe (Apple IAP, iOS):** `POST /v1/subscriptions/apple/verify-purchase` — see [Apple In-App Purchase](#apple-in-app-purchase-ios) below.
- **Wallet overview:** `GET /v1/subscriptions/wallet` — active subscription summary + `credits: { serious, featured }` and flags `canPublishFeatured` / `canPublishSerious` ([`subscription-wallet.service.ts`](../src/modules/monetization/subscription/subscription-wallet.service.ts)).

### Device limits (multi-phone login)

Plans include `device_limit` on `subscription_plans` (seeded: Basic/free = **1**, Professional = **2**, Gold = **4**). Auth enforces this via [`UserSessionService`](../src/modules/auth/user-session.service.ts):

- Each login creates a new server session; refresh reuses the existing session via refresh token.
- Optional `deviceLabel` on login/register is display-only for the devices list.
- New login at limit auto-revokes the oldest session.
- `GET /v1/subscriptions/devices` returns `{ id, deviceLabel, lastSeenAt, createdAt }`; `POST /v1/subscriptions/devices/:sessionId/revoke` revokes one.

See [`auth.md`](auth.md) for token and session lifecycle.

---

## Credit purchase (Paymob)

- **Endpoint:** `POST /v1/subscriptions/purchase/credits` with `productKey` matching `credit_products.key`. Optional `paymentMethod`: `card` or `wallet`.
- **Payment type mapping** ([`paymob-checkout.service.ts`](../src/modules/monetization/checkout/paymob-checkout.service.ts)):
  - `featured_bundle` → `featured_bundle`
  - `serious_single` → `serious_request`
  - any other product key → `featured_single` (ensure serious products use the key expected here, or extend the mapping)
- Fulfillment amounts in webhook: serious +1 featured single +1, bundle +15 (see [`payment-fulfillment.service.ts`](../src/modules/monetization/paymob/payment-fulfillment.service.ts)). Product metadata `credits_to_add` is stored but fulfillment uses these fixed amounts for the known payment types—keep products aligned with code or extend fulfillment to read metadata.

**iOS credits:** use Apple IAP with consumable products and `apple_product_id` on `credit_products` (same fulfillment path as subscriptions after verify).

---

## Apple In-App Purchase (iOS)

Required for App Store distribution (Paymob is not allowed on iOS). Android/web continue to use Paymob.

### Paymob vs Apple IAP

| Aspect | Paymob | Apple IAP |
| ------ | ------ | --------- |
| Checkout start | Backend creates Intention, returns `clientSecret` / URL | iOS app purchases via StoreKit 2; no backend checkout call |
| Verification | Paymob webhook (HMAC) | iOS sends `transactionId` → backend calls App Store Server API |
| Fulfillment | `PaymentFulfillmentService` | Same service (shared) |
| Renewals / refunds | Not handled | Apple server notifications → `POST /v1/payments/apple-webhook` |
| Price stored | EGP in `payments.amount_piasters` | `amount_piasters = 0` (Apple price not in EGP) |

### Flow

1. User completes purchase in iOS app (StoreKit 2).
2. App calls `POST /v1/subscriptions/apple/verify-purchase` with JWT body `{ transactionId, productId }`.
3. [`AppleIAPService`](../src/modules/monetization/apple/apple-iap.service.ts) checks idempotency (`payments.apple_transaction_id`), fetches transaction from Apple, verifies JWS, matches `productId` to `subscription_plans.apple_product_id` or `credit_products.apple_product_id`.
4. Inserts `payments` row (`pending`), runs [`AppleIAPRepo.finalizePayment`](../src/modules/monetization/apple/apple-iap.repo.ts) → same `fulfillSubscriptionTx` / credit fulfillment as Paymob → marks `success`.

### Schema

| Table | Column | Purpose |
| ----- | ------ | ------- |
| `payments` | `apple_transaction_id` | Idempotency key for Apple purchases |
| `subscription_plans` | `apple_product_id` | App Store subscription product ID |
| `credit_products` | `apple_product_id` | App Store consumable product ID |

Seed sets plan IDs with prefix `com.sakanapp.ios.*` (see [`subscription-plans.seed.ts`](../src/modules/db/seed/subscription-plans.seed.ts)):

| Plan | `apple_product_id` |
| ---- | ------------------ |
| Basic monthly | `com.sakanapp.ios.basic_monthly` |
| Professional monthly | `com.sakanapp.ios.professional_monthly` |
| Gold monthly | `com.sakanapp.ios.gold_monthly` |
| Professional yearly | `com.sakanapp.ios.professional_yearly` |
| Gold yearly | `com.sakanapp.ios.gold_yearly` |

Credit product IDs (set in App Store Connect + DB; not yet in seed):

| `credit_products.key` | Suggested `apple_product_id` |
| --------------------- | ---------------------------- |
| `serious_single` | `com.sakanapp.ios.serious_single` |
| `featured_single` | `com.sakanapp.ios.featured_single` |
| `featured_bundle` | `com.sakanapp.ios.featured_bundle` |

### Environment

```env
APPLE_BUNDLE_ID=com.sakanapp.ios
APPLE_APP_STORE_CONNECT_KEY_ID=
APPLE_APP_STORE_CONNECT_ISSUER_ID=
APPLE_APP_STORE_CONNECT_PRIVATE_KEY=   # ES256 PEM from App Store Connect
APPLE_IAP_SANDBOX=true                 # false in production
```

`APPLE_BUNDLE_ID` must match the Xcode bundle ID. Sandbox vs production is controlled by `APPLE_IAP_SANDBOX` (no per-payment environment column in DB).

### App Store Connect setup

1. **Subscriptions:** Monetization → Subscriptions → group (e.g. Sakkan Premium) → one subscription per plan/duration.
2. **Credits:** Monetization → In-App Purchases → **Consumable** per credit SKU.
3. **Server notifications:** Production URL `https://<api-host>/v1/payments/apple-webhook` (HTTPS required; use ngrok for local testing).

### Webhook ([`apple-iap-webhook.service.ts`](../src/modules/monetization/apple/apple-iap-webhook.service.ts))

Apple POSTs `{ "signedPayload": "..." }`. Service verifies JWS and handles:

| Notification | Action |
| ------------ | ------ |
| `SUBSCRIBED`, `DID_RENEW` | Fulfill subscription if payment still `pending` |
| `DID_FAIL_TO_RENEW`, `EXPIRED`, `GRACE_PERIOD_EXPIRED` | Mark user's subscription `expired` |
| `REFUND` | Mark payment `refunded` |
| Other | Log and ignore |

### Errors (i18n)

| Key | When |
| --- | ---- |
| `APPLE_TRANSACTION_ALREADY_PROCESSED` | Same `transactionId` already fulfilled |
| `APPLE_IAP_PRODUCT_NOT_FOUND` | No plan/credit row for `productId` |
| `APPLE_IAP_VERIFICATION_FAILED` | Apple API or JWS verification failed |

### Testing

You **cannot** create a real Apple purchase from the backend alone. Complete a **sandbox purchase on iOS** (or Xcode StoreKit test), then call verify with the real `transactionId`. Replay the same transaction returns `APPLE_TRANSACTION_ALREADY_PROCESSED`.

---

## Paymob webhook and fulfillment

- **Controller/service:** [`paymob-webhook.controller.ts`](../src/modules/monetization/paymob/paymob-webhook.controller.ts), [`paymob-webhook.service.ts`](../src/modules/monetization/paymob/paymob-webhook.service.ts).
- **Flow (success):** Verify HMAC → load payment by Paymob order id → ignore if not `pending` → on gateway success, run fulfillment.
- **Credit payments:** [`finalizePendingPaymentWithFulfillment`](../src/modules/monetization/paymob/paymob.service.ts) — **locks** payment row, runs `*Tx` fulfillment (credits + optional listing promote), then sets `success` **in the same transaction** so retries do not double-grant if the row is already finalized.
- **Subscription payments:** Same transactional path via `finalizePendingPaymentWithFulfillment` + `fulfillSubscriptionTx`.
- **Optional `listing_id` in payment metadata:** If set, serious/featured single fulfillment also calls **`promoteToPremiumByPaymentInTx`**. Current checkout does **not** set `listing_id`; only manual or future flows would.

---

## Listing expiry (cron)

[`ListingExpiryService`](../src/modules/monetization/expiry/listing-expiry.service.ts) runs daily at midnight: listings with `listing_tier = 'premium'` and `premium_expires_at < now()` are set to **`standard`**, **`UNLISTED`**, and premium fields cleared.

---

## HTTP surfaces (monetization-related)

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | `/v1/subscriptions/purchase/credits` | JWT | Start credit checkout (Paymob) |
| POST | `/v1/subscriptions/subscribe` | JWT | Start subscription checkout (Paymob) |
| POST | `/v1/subscriptions/apple/verify-purchase` | JWT | Verify Apple IAP and fulfill |
| GET | `/v1/subscriptions/plans` | Public | Plans |
| GET | `/v1/subscriptions/credit-products` | Public | Credit catalog |
| GET | `/v1/subscriptions/wallet` | JWT | Balances + sub summary |
| POST | `/v1/subscriptions/listings/:id/reveal-serious` | JWT | Deduct view quota / unlock |
| POST | `/v1/listings` | JWT | Create listing; body `makePremium` for atomic premium |
| POST | `/v1/payments/paymob-webhook` | Paymob HMAC | Paymob transaction callbacks |
| POST | `/v1/payments/apple-webhook` | Apple (JWS) | App Store Server Notifications v2 |

---

## Operational notes

1. **`listing_tier` enum:** Postgres must expose values `standard` and `premium`. If an old DB still has `serious`/`featured` labels only, run migration **`0040_listing_tier_enum_premium`** (see [`drizzle/0040_listing_tier_enum_premium.sql`](../drizzle/0040_listing_tier_enum_premium.sql)).
2. **`one_time_credits` unique:** Required for `ON CONFLICT` in `addCreditsTx`. Ensure migration for `one_time_credits_user_type_unique` is applied.
3. **Redis / BullMQ:** City listing counter uses a queue; if Redis is unreachable, awaiting `incrementListingCount` can delay or contribute to gateway timeouts—consider fire-and-forget or timeouts in [`ListingService`](../src/modules/listing/listing.service.ts) if needed.
4. **i18n:** Many errors use keys like `NO_QUOTA_OR_CREDITS`, `PAYMENT_FULFILLMENT_FAILED`, `APPLE_IAP_VERIFICATION_FAILED`; ensure translations exist under [`src/i18n`](../src/i18n).
5. **Apple IAP:** Map every App Store product ID to `apple_product_id` in DB before iOS verify calls. App Store Connect products must exist and match bundle ID `com.sakanapp.ios`.

---

## Module layout

- [`billing.module.ts`](../src/modules/monetization/billing.module.ts) — wires Paymob, Apple IAP, quotas, credits, subscriptions, listing promotion, webhooks, expiry cron.
- Apple: [`apple/apple-iap.service.ts`](../src/modules/monetization/apple/apple-iap.service.ts), [`apple-iap.repo.ts`](../src/modules/monetization/apple/apple-iap.repo.ts), [`apple-iap-webhook.service.ts`](../src/modules/monetization/apple/apple-iap-webhook.service.ts).
- [`listing.module.ts`](../src/modules/listing/listing.module.ts) — imports billing with `forwardRef` for `ListingPromotionService` on create.

---

*Generated from the codebase; update this file when behavior changes.*
