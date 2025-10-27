import { StorageService } from '@core/services/storage.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteFileCommand extends Command<void> {
  constructor(
    public readonly fileId: string,
    public readonly userId?: string,
  ) {
    super();
  }
}

@CommandHandler(DeleteFileCommand)
export class DeleteFileCommandHandler implements ICommandHandler<DeleteFileCommand> {
  constructor(private readonly storageService: StorageService) {}

  async execute(command: DeleteFileCommand) {
    const { fileId, userId } = command;

    const file = await this.storageService.getFileById(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check if the user has permission to delete the file
    if (userId && file.userId && file.userId !== userId) {
      throw new UnauthorizedException('You do not have permission to delete this file');
    }

    await this.storageService.deleteFile(fileId);
  }
}
