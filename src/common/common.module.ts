import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { PaginationService } from './services/pagination.service';
import { I18nExceptionFilter } from './filters/i18n-exception.filter';

@Global()
@Module({
  providers: [
    PaginationService,
    {
      provide: APP_FILTER,
      useClass: I18nExceptionFilter,
    },
  ],
  exports: [PaginationService],
})
export class CommonModule {}
