import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { IStorageProvider, IStorageFile } from '@core/services/storage.service';
import { File } from '@core/entities/file.entity';
import { IFileRepository } from '@core/repositories/file.repository.interface';
import { FILE_REPOSITORY } from '@shared/constants/tokens';

@Injectable()
export class MinioStorageProvider implements IStorageProvider {
  private minioClient: Minio.Client;
  private readonly publicBucket: string;
  private readonly privateBucket: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(FILE_REPOSITORY) private readonly fileRepository: IFileRepository,
  ) {
    const minioConfig = this.configService.get('storage.minio');
    this.publicBucket = minioConfig.publicBucket;
    this.privateBucket = minioConfig.privateBucket;

    this.minioClient = new Minio.Client({
      endPoint: minioConfig.endPoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
      region: minioConfig.region,
    });

    this.initializeBuckets().catch((err) => {
      console.error('Error initializing MinIO buckets:', err);
    });
  }

  private async initializeBuckets(): Promise<void> {
    const buckets = [this.publicBucket, this.privateBucket];

    for (const bucket of buckets) {
      const exists = await this.minioClient.bucketExists(bucket);
      if (!exists) {
        await this.minioClient.makeBucket(bucket, this.configService.get('storage.minio.region'));

        // Set public policy for public bucket
        if (bucket === this.publicBucket) {
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          };
          await this.minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
        }
      }
    }
  }

  async upload(file: IStorageFile, userId?: string): Promise<File> {
    const filename = `${uuidv4()}${path.extname(file.originalname)}`;
    const isPublic = this.isPublicFile(file.mimetype);
    const bucket = isPublic ? this.publicBucket : this.privateBucket;
    const filePath = userId ? `${userId}/${filename}` : filename;

    await this.minioClient.putObject(bucket, filePath, file.buffer);

    const fileEntity = new File(
      filename,
      file.originalname,
      filePath,
      file.mimetype,
      file.size,
      bucket,
      userId || null,
      isPublic,
    );

    return this.fileRepository.save(fileEntity);
  }

  async getSignedUrl(file: File): Promise<string> {
    const expiry = 24 * 60 * 60; // 24 hours in seconds

    return this.minioClient.presignedGetObject(file.bucket, file.path, expiry);
  }

  async delete(file: File): Promise<void> {
    await this.minioClient.removeObject(file.bucket, file.path);
  }

  private isPublicFile(mimeType: string): boolean {
    // Consider images and PDFs as public by default
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  }
}
