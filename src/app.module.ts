import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './modules/db/drizzle.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ListingModule } from './modules/listing/listing.module';
import { CityModule } from './modules/city/city.module';
import { CommonModule } from './common/common.module';
import { FavoriteModule } from './modules/favorite/favorite.module';
import { ReportModule } from './modules/report/report.module';
import { TodoModule } from './modules/todo/todo.module';
import { NoteModule } from './modules/note/note.module';
import { PreferenceModule } from './modules/preference/preference.module';
import { AdminModule } from './admin/admin.module';
import { BullModule } from '@nestjs/bullmq';
import { MonetizationModule } from './modules/monetization/monetization.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.NODE_ENV === 'production' ? process.env.REDIS_PASSWORD : undefined,
        tls: process.env.NODE_ENV === 'production' ? {} : undefined,
      },
    }),
    CommonModule,
    DrizzleModule,
    AuthModule,
    UserModule,
    ListingModule,
    CityModule,
    FavoriteModule,
    ReportModule,
    TodoModule,
    NoteModule,
    PreferenceModule,
    AdminModule,
    MonetizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
