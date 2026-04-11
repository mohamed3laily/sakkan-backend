import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export type S3Folder = 'profile-pictures' | 'listing-images';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.getOrThrow('AWS_REGION');
    this.bucket = this.config.getOrThrow('AWS_S3_BUCKET');
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.config.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(folder: S3Folder, file: Express.Multer.File): Promise<{ url: string; key: string }> {
    const ext = file.originalname.split('.').pop();
    const key = `${folder}/${randomUUID()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      key,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
    };
  }

  async deleteByKey(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {}
  }
  async delete(publicUrl: string): Promise<void> {
    try {
      const key = new URL(publicUrl).pathname.slice(1);
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {}
  }
}
