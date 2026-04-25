import { Module, forwardRef } from '@nestjs/common';
import { ListingService } from './listing.service';
import { ListingController } from './listing.controller';
import { ListingsRepository } from './listing.repo';
import { CityModule } from '../city/city.module';
import { GeoValidationService } from './geo-validation.service';
import { AttachmentModule } from '../attachment/attachment.module';
import { BillingModule } from '../monetization/billing.module';
import { ContactGateInterceptor } from './interceptors/contact-gate.interceptor';

@Module({
  imports: [CityModule, AttachmentModule, forwardRef(() => BillingModule)],
  providers: [ListingService, ListingsRepository, GeoValidationService, ContactGateInterceptor],
  controllers: [ListingController],
  exports: [ListingsRepository],
})
export class ListingModule {}
