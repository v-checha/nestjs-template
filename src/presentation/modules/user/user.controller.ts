import { Controller, Get, Post, Body, Put, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Guards & Decorators
import { PermissionsGuard } from '@presentation/guards/permissions.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';

// DTOs
import { UpdateUserRequest, ChangePasswordRequest, IJwtPayload } from '@application/dtos';

// Queries
import { GetUserQuery } from '@application/queries/user/get-user.query';

// Commands
import { UpdateUserCommand } from '@application/commands/user/update-user.command';
import { ChangePasswordCommand } from '@application/commands/user/change-password.command';
import { VerifyPasswordCommand } from '@application/commands/user/verify-password.command';

@ApiTags('user-profile')
@Controller('users')
@UseGuards(PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns current user profile' })
  async getCurrentUserProfile(@CurrentUser() user: IJwtPayload) {
    return this.queryBus.execute(new GetUserQuery(user.sub));
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async updateCurrentUserProfile(@CurrentUser() user: IJwtPayload, @Body() updateUserDto: UpdateUserRequest) {
    return this.commandBus.execute(
      new UpdateUserCommand(user.sub, updateUserDto.firstName, updateUserDto.lastName, updateUserDto.email),
    );
  }

  @Post('profile/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password changed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Current password is incorrect' })
  async changeCurrentUserPassword(@CurrentUser() user: IJwtPayload, @Body() changePasswordDto: ChangePasswordRequest) {
    await this.commandBus.execute(
      new ChangePasswordCommand(user.sub, changePasswordDto.newPassword, changePasswordDto.currentPassword),
    );

    return { message: 'Password changed successfully' };
  }

  @Post('profile/verify-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify current user password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password verification result' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async verifyCurrentUserPassword(@CurrentUser() user: IJwtPayload, @Body('password') password: string) {
    const isValid = await this.commandBus.execute(new VerifyPasswordCommand(user.sub, password));

    return { valid: isValid };
  }
}
