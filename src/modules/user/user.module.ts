import { Module } from '@nestjs/common';
import { ListingModule } from './me/listing/listing.module';
import { MeModule } from './me/me.module';
import { ReviewModule } from './review/review.module';
import { RouterModule } from '@nestjs/core';
import { UserController } from './user.controller';
import { UserRepo } from './user.repo';
import { UserService } from './user.service';
import { PreferenceModule } from '../preference/preference.module';

@Module({
  providers: [UserService, UserRepo],
  exports: [UserService, UserRepo],
  controllers: [UserController],
  imports: [
    MeModule,
    ReviewModule,
    PreferenceModule,
    RouterModule.register([
      {
        path: 'users',
        module: UserModule,
        children: [
          {
            path: 'me',
            module: MeModule,
            children: [{ path: 'listings', module: ListingModule }],
          },
          {
            path: 'agents',
            module: ReviewModule,
          },
        ],
      },
    ]),
  ],
})
export class UserModule {}
