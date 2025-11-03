import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiParam, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { PermissionsGuard } from '@presentation/guards/permissions.guard';
import { RequiresResourceAction } from '@shared/decorators/resource-action.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { ResourceType, ActionType } from '@core/value-objects/resource-action.vo';
import { UploadFileCommand } from '@application/commands/storage/upload-file.command';
import { DeleteFileCommand } from '@application/commands/storage/delete-file.command';
import { UpdateFileAccessCommand } from '@application/commands/storage/update-file-access.command';
import { GetFileQuery } from '@application/queries/storage/get-file.query';
import { GetUserFilesQuery } from '@application/queries/storage/get-user-files.query';

import { UpdateFileAccessRequest, FileResponse, IJwtPayload } from '@application/dtos';

@ApiTags('storage')
@Controller('storage')
@UseGuards(PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class StorageController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('upload')
  @RequiresResourceAction(ResourceType.STORAGE, ActionType.CREATE)
  @ApiOperation({ summary: 'Upload a file (Requires storage:create permission)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'File uploaded successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: IJwtPayload,
  ): Promise<FileResponse> {
    const storageFile = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    return this.commandBus.execute(new UploadFileCommand(storageFile, user.sub));
  }

  @Get(':id')
  @RequiresResourceAction(ResourceType.STORAGE, ActionType.READ)
  @ApiOperation({ summary: 'Get file by ID (Requires storage:read permission)' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File retrieved successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'File not found' })
  async getFile(@Param('id') id: string, @CurrentUser() user: IJwtPayload): Promise<FileResponse> {
    return this.queryBus.execute(new GetFileQuery(id, user.sub));
  }

  @Get('user/files')
  @RequiresResourceAction(ResourceType.STORAGE, ActionType.READ)
  @ApiOperation({
    summary: 'Get all files for the current user (Requires storage:read permission)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Files retrieved successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async getUserFiles(@CurrentUser() user: IJwtPayload): Promise<FileResponse[]> {
    return this.queryBus.execute(new GetUserFilesQuery(user.sub));
  }

  @Delete(':id')
  @RequiresResourceAction(ResourceType.STORAGE, ActionType.DELETE)
  @ApiOperation({ summary: 'Delete a file (Requires storage:delete permission)' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File deleted successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'File not found' })
  async deleteFile(@Param('id') id: string, @CurrentUser() user: IJwtPayload): Promise<void> {
    return this.commandBus.execute(new DeleteFileCommand(id, user.sub));
  }

  @Patch(':id/access')
  @RequiresResourceAction(ResourceType.STORAGE, ActionType.UPDATE)
  @ApiOperation({
    summary: 'Update file access (public/private) - Requires storage:update permission',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'File access updated successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'File not found' })
  async updateFileAccess(
    @Param('id') id: string,
    @Body() updateFileAccessDto: UpdateFileAccessRequest,
    @CurrentUser() user: IJwtPayload,
  ): Promise<FileResponse> {
    return this.commandBus.execute(new UpdateFileAccessCommand(id, updateFileAccessDto.isPublic, user.sub));
  }
}
