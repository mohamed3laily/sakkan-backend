import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AUTH_THROTTLE, STRICT_AUTH_THROTTLE } from '../throttling/throttle.constants';

export function AuthThrottle() {
  return applyDecorators(
    Throttle({ default: { limit: AUTH_THROTTLE.limit, ttl: AUTH_THROTTLE.ttl } }),
  );
}

export function StrictAuthThrottle() {
  return applyDecorators(
    Throttle({
      default: {
        limit: STRICT_AUTH_THROTTLE.limit,
        ttl: STRICT_AUTH_THROTTLE.ttl,
      },
    }),
  );
}
