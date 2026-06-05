import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSLATION_KEY = 'skipTranslation';

export const SkipTranslation = () => SetMetadata(SKIP_TRANSLATION_KEY, true);
