import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { CurrentAuth, SessionAuthGuard, type AuthContext } from '../platform/auth.guard';

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

type UploadedImage = {
  filename: string;
  originalname: string;
  mimetype: string;
};

export function staticRoot() {
  return join(__dirname, '..', '..', '..', 'static');
}

export function uploadsDir() {
  const dir = join(staticRoot(), 'uploads');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

@Controller('uploads')
@UseGuards(SessionAuthGuard)
export class UploadsController {
  constructor(private readonly config: ConfigService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          _req: unknown,
          _file: unknown,
          cb: (error: Error | null, destination: string) => void,
        ) => cb(null, uploadsDir()),
        filename: (
          _req: unknown,
          file: { originalname: string },
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const ext = extname(file.originalname || '').toLowerCase() || '.jpg';
          cb(null, `${uuid()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (
        _req: unknown,
        file: { originalname: string; mimetype: string },
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const ext = extname(file.originalname || '').toLowerCase();
        const ok =
          ALLOWED.has(ext) ||
          (file.mimetype || '').startsWith('image/');
        if (!ok) {
          cb(new BadRequestException('فقط تصویر jpg، png، webp یا gif'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @CurrentAuth() _auth: AuthContext,
    @UploadedFile() file?: UploadedImage,
  ) {
    if (!file) throw new BadRequestException('فایلی انتخاب نشده است');
    const publicBase = (
      this.config.get<string>('PUBLIC_API_BASE_URL') ??
      `http://localhost:${this.config.get('API_PORT') ?? 3001}`
    ).replace(/\/$/, '');
    return {
      url: `${publicBase}/static/uploads/${file.filename}`,
      filename: file.filename,
    };
  }
}
