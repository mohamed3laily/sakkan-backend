import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './modules/db/drizzle.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ListingModule } from './modules/listing/listing.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DrizzleModule, AuthModule, UserModule, ListingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
