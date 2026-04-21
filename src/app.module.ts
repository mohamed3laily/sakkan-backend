import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './modules/db/drizzle.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { ScheduleModule } from '@nestjs/schedule';
import { BillingModule } from './modules/monetization/billing.module';
import { StorageModule } from './modules/storage/storage.module';
import { AttachmentModule } from './modules/attachment/attachment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: Number(config.get('REDIS_PORT')),
          password: config.get('REDIS_PASSWORD') || undefined,
        },
      }),
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
    BillingModule,
    StorageModule,
    AttachmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
