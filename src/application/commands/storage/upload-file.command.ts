import { FileResponse } from '@application/dtos';
import { IStorageFile, StorageService } from '@core/services/storage.service';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FileMapper } from '../../mappers/file.mapper';

export class UploadFileCommand extends Command<FileResponse> {
  constructor(
    public readonly file: IStorageFile,
    public readonly userId?: string,
  ) {
    super();
  }
}

@CommandHandler(UploadFileCommand)
export class UploadFileCommandHandler implements ICommandHandler<UploadFileCommand> {
  constructor(
    private readonly storageService: StorageService,
    private readonly fileMapper: FileMapper,
  ) {}

  async execute(command: UploadFileCommand) {
    const { file, userId } = command;

    const fileEntity = await this.storageService.uploadFile(file, userId);

    return this.fileMapper.toResponseDto(fileEntity);
  }
}
