# Listings (Sakkan backend)

Public and owner listing APIs, tiers, geo validation, and contact gating. Monetization rules (premium, quotas) are in [`monetization.md`](monetization.md).

---

## Concepts

| Concept | Meaning |
| ------- | ------- |
| **Listing type** | `OFFER` (seller offer) or `REQUEST` (buyer serious request) |
| **Deal type** | `RENT` or `BUY` |
| **Status** | `PUBLISHED`, `UNLISTED`, `PENDING` |
| **Tier** | `standard` (default) or `premium` (time-boxed, 15 days) |
| **Contact gate** | Premium `REQUEST` listings hide contact until viewer unlocks via subscription quota |

Enums: [`listing/enums.ts`](../src/modules/db/schemas/listing/enums.ts)

---

## Public listing API

Controller: [`listing.controller.ts`](../src/modules/listing/listing.controller.ts)  
Service: [`listing.service.ts`](../src/modules/listing/listing.service.ts)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/v1/listings/property-types` | Public | Property type catalog |
| POST | `/v1/listings` | JWT | Create listing (multipart images, max 6) |
| GET | `/v1/listings` | Public (optional JWT) | Search/browse listings |
| GET | `/v1/listings/:id` | Public (optional JWT) | Single listing detail |

Class-level `@UseGuards(JwtAuthGuard)` with `@Public()` on GET routes enables optional authentication.

---

## Owner listing API

Controller: [`user/me/listing/listing.controller.ts`](../src/modules/user/me/listing/listing.controller.ts)  
Nested path: **`/v1/users/me/listings`**

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/v1/users/me/listings` | JWT | Current user's listings |
| GET | `/v1/users/me/listings/:id` | JWT | Owner listing detail |
| DELETE | `/v1/users/me/listings/:id` | JWT | Delete own listing |

---

## Create listing flow

1. **Geo validation** — if lat/lng provided, point must fall inside selected area polygon ([`geo-validation.service.ts`](../src/modules/listing/geo-validation.service.ts)); error: `LOCATION_VALIDATION_FAILED`
2. **Images** — multer upload → S3 via [`storage`](../src/modules/storage/) module
3. **Insert** — listing row in DB
4. **City counter** — enqueue `increment-listing-count` on BullMQ `city` queue
5. **Premium (optional)** — if `makePremium === true`, atomic transaction promotes listing (see [`monetization.md`](monetization.md))

---

## Contact gate interceptor

[`contact-gate.interceptor.ts`](../src/modules/listing/interceptors/contact-gate.interceptor.ts)

Applied on public GET listing endpoints. For premium **REQUEST** listings:

- Masks `contactWhatsapp`, `contactPhone`, and owner `user.phone` as `"HIDDEN"`
- Owner always sees full contact
- Viewers with a `serious_request_unlocks` row see full contact
- Sets `isQuotaRevealed` flag on response

Unlock flow: `POST /v1/subscriptions/listings/:id/reveal-serious` (deducts subscription view quota).

---

## Premium and expiry

- Premium promotion rules differ for `OFFER` vs `REQUEST` — see [`monetization.md`](monetization.md)
- [`ListingExpiryService`](../src/modules/monetization/expiry/listing-expiry.service.ts) runs daily: expired premium listings → `standard` + `UNLISTED`

---

## Admin listing moderation

See [`admin.md`](admin.md) — `/v1/admin/listings/*`

---

## Error keys (common)

| Key | When |
| --- | ---- |
| `LOCATION_VALIDATION_FAILED` | Coordinates outside selected area |
| `NO_QUOTA_OR_CREDITS` | Premium promotion without quota/credits |

Translations: `src/i18n/en/listing.json`, `src/i18n/ar/listing.json`

---

## When modifying this area

1. New listing field → update schema, DTO, select builders (`listing-select.builder.ts`), and both i18n locales
2. Search/filter changes → [`listing-query.builder.ts`](../src/modules/listing/builders/listing-query.builder.ts) and DTO
3. Contact visibility rules → `ContactGateInterceptor` + unlock repo in monetization
4. Premium behavior → [`ListingPromotionService`](../src/modules/monetization/listing-promotion/listing-promotion.service.ts) and [`monetization.md`](monetization.md)
5. Schema/migration → follow checklist in [`AGENTS.md`](../AGENTS.md)

---

*Update this file when listing behavior or API changes.*
