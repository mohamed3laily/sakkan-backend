import { SetMetadata } from '@nestjs/common';

export const ALLOW_UNVERIFIED_KEY = 'allow-unverified';

export const AllowUnverified = () => SetMetadata(ALLOW_UNVERIFIED_KEY, true);
