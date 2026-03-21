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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
