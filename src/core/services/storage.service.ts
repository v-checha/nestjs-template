import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFileRepository } from '../repositories/file.repository.interface';
import { File } from '../entities/file.entity';
import { FILE_REPOSITORY } from '@shared/constants/tokens';

export interface IStorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface IStorageProvider {
  upload(file: IStorageFile, userId?: string): Promise<File>;
  getSignedUrl(file: File): Promise<string>;
  delete(file: File): Promise<void>;
}

@Injectable()
export class StorageService {
  private provider: IStorageProvider;

  constructor(
    @Inject(FILE_REPOSITORY) private readonly fileRepository: IFileRepository,
    private readonly configService: ConfigService,
  ) {}

  setProvider(provider: IStorageProvider): void {
    this.provider = provider;
  }

  async uploadFile(file: IStorageFile, userId?: string): Promise<File> {
    return this.provider.upload(file, userId);
  }

  async getFileById(id: string): Promise<File | null> {
    return this.fileRepository.findById(id);
  }

  async getFilesByUserId(userId: string): Promise<File[]> {
    return this.fileRepository.findByUserId(userId);
  }

  async getAllFiles(page: number = 1, limit: number = 20): Promise<{ files: File[]; total: number }> {
    return this.fileRepository.findAll(page, limit);
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.fileRepository.findById(id);
    if (file) {
      await this.provider.delete(file);
      await this.fileRepository.delete(id);
    }
  }

  async makeFilePublic(id: string): Promise<File | null> {
    const file = await this.fileRepository.findById(id);
    if (file) {
      file.makePublic();

      return this.fileRepository.update(file);
    }

    return null;
  }

  async makeFilePrivate(id: string): Promise<File | null> {
    const file = await this.fileRepository.findById(id);
    if (file) {
      file.makePrivate();

      return this.fileRepository.update(file);
    }

    return null;
  }

  async getFileUrl(id: string): Promise<string | null> {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      return null;
    }

    if (file.isPublic) {
      return `${this.configService.get<string>('storage.publicUrl')}/${file.path}`;
    }

    return this.provider.getSignedUrl(file);
  }
}
