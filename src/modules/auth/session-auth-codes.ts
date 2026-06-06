import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { sessionRevokeReasonEnum } from '../db/schemas/monetization/enums';

export type SessionRevokeReason = (typeof sessionRevokeReasonEnum.enumValues)[number];

export type PublicSessionAuthCode =
  | 'SESSION_REVOKED_DEVICE_LIMIT'
  | 'SESSION_REVOKED'
  | 'SESSION_EXPIRED'
  | 'ACCOUNT_DEACTIVATED'
  | 'INVALID_REFRESH_TOKEN';

export function toPublicRevokeCode(
  reason: SessionRevokeReason | null | undefined,
): PublicSessionAuthCode {
  if (reason === 'device_limit') {
    return 'SESSION_REVOKED_DEVICE_LIMIT';
  }
  if (reason === 'account_deactivated') {
    return 'ACCOUNT_DEACTIVATED';
  }
  return 'SESSION_REVOKED';
}

export function createSessionAuthException(
  code: PublicSessionAuthCode,
): UnauthorizedException | ForbiddenException {
  if (code === 'ACCOUNT_DEACTIVATED') {
    return new ForbiddenException({ message: code, code });
  }
  return new UnauthorizedException({ message: code, code });
}
