import { Injectable } from '@nestjs/common';
import { S3Service, S3Folder } from 'src/modules/storage/s3.service';
import { AttachmentRepository } from './attachment.repo';

const ENTITY_FOLDER: Record<string, S3Folder> = {
  LISTING: 'listing-images',
};

@Injectable()
export class AttachmentService {
  constructor(
    private readonly repo: AttachmentRepository,
    private readonly s3: S3Service,
  ) {}

  async createMany(attachableType: any, attachableId: number, files: Express.Multer.File[]) {
    const folder = ENTITY_FOLDER[attachableType];
    const uploaded = await Promise.all(files.map((f) => this.s3.upload(folder, f)));

    return this.repo.insertMany(
      uploaded.map(({ url, key }, i) => ({
        attachableType,
        attachableId,
        fileType: 'IMAGE' as const,
        url,
        key,
        mimeType: files[i].mimetype,
        size: files[i].size,
      })),
    );
  }
}
