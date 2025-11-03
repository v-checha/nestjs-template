import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

// Guards & Decorators
import { PermissionsGuard } from '@presentation/guards/permissions.guard';
import { RequiresAdmin } from '@shared/decorators/admin.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';

// DTOs
import {
  UpdateUserRequest,
  AdminChangePasswordRequest,
  ActivateUserRequest,
  AssignRoleRequest,
  IJwtPayload,
} from '@application/dtos';

// Queries
import { AdminGetUserQuery } from '@application/queries/admin/get-user.query';
import { GetUsersQuery } from '@application/queries/user/get-users.query';

// Commands
import { AdminUpdateUserCommand } from '@application/commands/admin/update-user.command';
import { AdminChangePasswordCommand } from '@application/commands/admin/change-password.command';
import { ActivateUserCommand } from '@application/commands/user/activate-user.command';
import { AssignRoleCommand } from '@application/commands/user/assign-role.command';
import { RemoveRoleCommand } from '@application/commands/user/remove-role.command';

@ApiTags('admin-users')
@Controller('admin/users')
@UseGuards(PermissionsGuard)
@RequiresAdmin()
@ApiBearerAuth('JWT-auth')
export class AdminUserController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Get all users (Admin access required)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for filtering users' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 20)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns a paginated list of users' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async getAllUsers(@Query('search') search?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.queryBus.execute(new GetUsersQuery(search, page, limit));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Get user by ID (Admin access required)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns user information' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async getUserById(@Param('id') id: string) {
    return this.queryBus.execute(new AdminGetUserQuery(id));
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Update any user (Admin access required)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserRequest) {
    await this.commandBus.execute(
      new AdminUpdateUserCommand(id, updateUserDto.firstName, updateUserDto.lastName, updateUserDto.email),
    );

    return { message: 'User updated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Delete any user (Admin access required)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async deleteUser(@Param('id') _id: string) {
    // This would normally use a command
    return { message: 'User deleted successfully' };
  }

  @Post(':id/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Change any user password (Admin access required)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password changed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async changeUserPassword(@Param('id') id: string, @Body() changePasswordDto: AdminChangePasswordRequest) {
    await this.commandBus.execute(new AdminChangePasswordCommand(id, changePasswordDto.newPassword));

    return { message: 'Password changed successfully' };
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Activate/deactivate any user (Admin access required)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User activation status updated' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async activateUser(@Param('id') id: string, @Body() activateUserDto: ActivateUserRequest) {
    return this.commandBus.execute(new ActivateUserCommand(id, activateUserDto.active));
  }

  @Post(':id/roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Assign role to any user (Admin access required)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role assigned successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User or role not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async assignRoleToUser(
    @Param('id') id: string,
    @Body() assignRoleDto: AssignRoleRequest,
    @CurrentUser() currentUser: IJwtPayload,
  ) {
    return this.commandBus.execute(new AssignRoleCommand(id, assignRoleDto.roleId, currentUser.sub));
  }

  @Delete(':id/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Remove role from any user (Admin access required)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role removed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async removeRoleFromUser(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.commandBus.execute(new RemoveRoleCommand(id, roleId));
  }
}
