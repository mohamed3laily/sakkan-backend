import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const imageUploadInterceptorOptions: MulterOptions = {
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowedMimeTypes =
      /^image\/(jpeg|png|webp|jpg|gif|bmp|tiff|svg\+xml|svg|x-icon|vnd\.microsoft\.icon|heic|heif)$/i;

    const isOctetStream = file.mimetype === 'application/octet-stream';

    if (!file.mimetype.match(allowedMimeTypes) && !isOctetStream) {
      return cb(new BadRequestException('INVALID_FILE_TYPE'), false);
    }

    cb(null, true);
  },
};
