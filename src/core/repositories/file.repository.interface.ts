import { File } from '../entities/file.entity';

export interface IFileRepository {
  findById(id: string): Promise<File | null>;
  findByUserId(userId: string): Promise<File[]>;
  save(file: File): Promise<File>;
  update(file: File): Promise<File>;
  delete(id: string): Promise<void>;
  findByPath(path: string): Promise<File | null>;
}
