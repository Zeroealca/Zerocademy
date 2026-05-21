import { BadRequestException } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { INSTITUTIONS_CONTEXT, INSTITUTION_LOG_EVENTS } from './constants';
import { AppLoggerService } from '../../common/logger/app-logger.service';

const LOGO_MAX_BYTES = 5 * 1024 * 1024;
const LOGO_MAX_DIMENSION = 512;
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export const INSTITUTION_LOGO_PUBLIC_PREFIX = '/uploads/institutions';

export function institutionLogoPublicPath(institutionId: string): string {
  return `${INSTITUTION_LOGO_PUBLIC_PREFIX}/${institutionId}/logo.webp`;
}

export function institutionLogoDiskPath(
  uploadsRoot: string,
  institutionId: string,
): string {
  return join(uploadsRoot, 'institutions', institutionId, 'logo.webp');
}

export function assertValidLogoUpload(file: Express.Multer.File | undefined): void {
  if (!file) {
    throw new BadRequestException('Logo file is required');
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestException(
      'Invalid image type. Allowed: PNG, JPEG, WebP, GIF',
    );
  }

  if (file.size > LOGO_MAX_BYTES) {
    throw new BadRequestException('Logo file must be 5 MB or smaller');
  }
}

export async function processAndStoreInstitutionLogo(params: {
  uploadsRoot: string;
  institutionId: string;
  file: Express.Multer.File;
  logger: AppLoggerService;
}): Promise<string> {
  const { uploadsRoot, institutionId, file, logger } = params;

  const outputDir = join(uploadsRoot, 'institutions', institutionId);
  const outputPath = institutionLogoDiskPath(uploadsRoot, institutionId);
  const publicPath = institutionLogoPublicPath(institutionId);

  await mkdir(outputDir, { recursive: true });

  const metadata = await sharp(file.buffer).metadata();
  const hasAlpha = metadata.hasAlpha === true;

  let pipeline = sharp(file.buffer).rotate().resize({
    width: LOGO_MAX_DIMENSION,
    height: LOGO_MAX_DIMENSION,
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (hasAlpha) {
    pipeline = pipeline.webp({ lossless: true, effort: 4 });
  } else {
    pipeline = pipeline.webp({ quality: 88, effort: 4, smartSubsample: true });
  }

  const optimized = await pipeline.toBuffer();
  await writeFile(outputPath, optimized);

  logger.log({
    context: INSTITUTIONS_CONTEXT,
    event: INSTITUTION_LOG_EVENTS.BRANDING_UPDATED,
    message: 'Institution logo optimized and stored',
    metadata: {
      institutionId,
      hasAlpha,
      bytes: optimized.length,
      format: 'webp',
    },
  });

  return publicPath;
}
