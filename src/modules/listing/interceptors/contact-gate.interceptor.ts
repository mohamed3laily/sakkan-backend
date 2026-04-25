import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { SeriousRequestUnlockRepository } from '../../monetization/quota/serious-request-unlock.repository';

type Listing = Record<string, unknown>;
type PaginatedResponse = { data: unknown[]; [key: string]: unknown };

const HIDDEN = 'HIDDEN' as const;

/**
 * Masks contact fields (contactWhatsapp, contactPhone, user.phone) on
 * premium REQUEST listings unless the viewer owns the listing or has
 * a confirmed unlock row.
 *
 * Sets `isQuotaRevealed` on gated listings: true when the viewer (not the
 * owner) previously unlocked this listing via reveal-serious; false otherwise.
 *
 * Handles both single-listing and paginated responses.
 * Safe for unauthenticated callers — no user means always hidden.
 */
@Injectable()
export class ContactGateInterceptor implements NestInterceptor {
  constructor(private readonly seriousRequestUnlockRepository: SeriousRequestUnlockRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const viewerUserId = context.switchToHttp().getRequest<{ user?: { id: number } }>().user?.id;

    return next
      .handle()
      .pipe(switchMap((response) => from(this.processResponse(response, viewerUserId))));
  }

  // ── Response routing ─────────────────────────────────────────────────────

  private async processResponse(response: unknown, viewerUserId: number | undefined) {
    if (isPaginated(response)) {
      const masked = await Promise.all(
        response.data.map((item) => this.maskIfNeeded(item, viewerUserId)),
      );
      return { ...response, data: masked };
    }

    if (isListing(response)) {
      return this.maskIfNeeded(response, viewerUserId);
    }

    return response;
  }

  // ── Masking logic ────────────────────────────────────────────────────────

  private async maskIfNeeded(item: unknown, viewerUserId: number | undefined) {
    if (!isListing(item) || !requiresGating(item)) return item;

    if (isOwner(item, viewerUserId)) {
      return { ...item, isQuotaRevealed: false };
    }

    if (viewerUserId === undefined) {
      return { ...applyMask(item), isQuotaRevealed: false };
    }

    const hasUnlock = await this.seriousRequestUnlockRepository.isUnlocked(
      item.id as number,
      viewerUserId,
    );
    if (hasUnlock) {
      return { ...item, isQuotaRevealed: true };
    }

    return { ...applyMask(item), isQuotaRevealed: false };
  }
}

// ── Pure helpers (no class state needed) ────────────────────────────────────

function requiresGating(listing: Listing): boolean {
  return listing.listingType === 'REQUEST' && listing.listingTier === 'premium';
}

function isOwner(listing: Listing, viewerUserId: number | undefined): boolean {
  if (viewerUserId === undefined) return false;
  const ownerId =
    typeof listing.userId === 'number'
      ? listing.userId
      : isRecord(listing.user)
        ? (listing.user.id as number | undefined)
        : undefined;
  return ownerId === viewerUserId;
}

function applyMask(listing: Listing): Listing {
  return {
    ...listing,
    ...('contactWhatsapp' in listing && { contactWhatsapp: HIDDEN }),
    ...('contactPhone' in listing && { contactPhone: HIDDEN }),
    ...(isRecord(listing.user) &&
      'phone' in listing.user && {
        user: { ...listing.user, phone: HIDDEN },
      }),
  };
}

// ── Type guards ──────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isListing(value: unknown): value is Listing {
  return isRecord(value) && 'listingType' in value && 'listingTier' in value;
}

function isPaginated(value: unknown): value is PaginatedResponse {
  return isRecord(value) && Array.isArray(value.data);
}
