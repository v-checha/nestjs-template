import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { IStorageProvider, IStorageFile } from '@core/services/storage.service';
import { File } from '@core/entities/file.entity';
import { IFileRepository } from '@core/repositories/file.repository.interface';
import { FILE_REPOSITORY } from '@shared/constants/tokens';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly s3Client: S3Client;
  private readonly publicBucket: string;
  private readonly privateBucket: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(FILE_REPOSITORY) private readonly fileRepository: IFileRepository,
  ) {
    const awsConfig = this.configService.get('storage.aws');
    this.publicBucket = awsConfig.publicBucket;
    this.privateBucket = awsConfig.privateBucket;

    this.s3Client = new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    });
  }

  async upload(file: IStorageFile, userId?: string): Promise<File> {
    const filename = `${uuidv4()}${path.extname(file.originalname)}`;
    const isPublic = this.isPublicFile(file.mimetype);
    const bucket = isPublic ? this.publicBucket : this.privateBucket;
    const filePath = userId ? `${userId}/${filename}` : filename;

    const params = {
      Bucket: bucket,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.s3Client.send(new PutObjectCommand(params));

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
    const command = new GetObjectCommand({
      Bucket: file.bucket,
      Key: file.path,
    });

    // URL expires in 24 hours
    return getSignedUrl(this.s3Client, command, { expiresIn: 60 * 60 * 24 });
  }

  async delete(file: File): Promise<void> {
    const params = {
      Bucket: file.bucket,
      Key: file.path,
    };

    await this.s3Client.send(new DeleteObjectCommand(params));
  }

  private isPublicFile(mimeType: string): boolean {
    // Consider images and PDFs as public by default
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  }
}
