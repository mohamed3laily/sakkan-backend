import { Global, Module } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';
import { CitiesAreasSeed } from './seed/cities-areas.seed';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [DrizzleService, CitiesAreasSeed],
  exports: [DrizzleService],
})
export class DrizzleModule {}
