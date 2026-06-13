import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/modules/db/drizzle.module';
import { AttachmentModule } from 'src/modules/attachment/attachment.module';
import { StorageModule } from 'src/modules/storage/storage.module';
import { RealEstateDevelopersController } from './real-estate-developers.controller';
import { DevelopersService } from './developers.service';
import { DevelopersRepo } from './developers.repo';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { ProjectsRepo } from './projects/projects.repo';
import { DeveloperListingsController } from './listings/developer-listings.controller';
import { DeveloperListingsService } from './listings/developer-listings.service';
import { DeveloperListingsRepo } from './listings/developer-listings.repo';

@Module({
  imports: [DrizzleModule, StorageModule, AttachmentModule],
  controllers: [ProjectsController, DeveloperListingsController, RealEstateDevelopersController],
  providers: [
    DevelopersService,
    DevelopersRepo,
    ProjectsService,
    ProjectsRepo,
    DeveloperListingsService,
    DeveloperListingsRepo,
  ],
})
export class RealEstateDevelopersParentModule {}
