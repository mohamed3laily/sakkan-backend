import { Global, Module } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';
import { CitiesAreasSeed } from './seed/cities-areas.seed';
import { ConfigModule } from '@nestjs/config';
import { PropertyTypeSeed } from './seed/property-type.seed';
import { CitiesSeed } from './seed/cities.seed';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [DrizzleService, CitiesAreasSeed, PropertyTypeSeed, CitiesSeed],
  exports: [DrizzleService],
})
export class DrizzleModule {}
