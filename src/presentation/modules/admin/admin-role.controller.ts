import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

// Guards & Decorators
import { PermissionsGuard } from '@presentation/guards/permissions.guard';
import { RequiresAdmin } from '@shared/decorators/admin.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { IJwtPayload, CreateRoleRequest, UpdateRoleRequest } from '@application/dtos';

// Queries
import { GetRolesQuery } from '@application/queries/role/get-roles.query';
import { GetRoleQuery } from '@application/queries/role/get-role.query';
import { GetPermissionsQuery } from '@application/queries/permission/get-permissions.query';

// Commands
import { CreateRoleCommand } from '@application/commands/role/create-role.command';
import { UpdateRoleCommand } from '@application/commands/role/update-role.command';
import { DeleteRoleCommand } from '@application/commands/role/delete-role.command';
import { AssignPermissionCommand } from '@application/commands/role/assign-permission.command';
import { RemovePermissionCommand } from '@application/commands/role/remove-permission.command';

@ApiTags('admin-roles')
@Controller('admin/roles')
@UseGuards(PermissionsGuard)
@RequiresAdmin()
@ApiBearerAuth('JWT-auth')
export class AdminRoleController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Get all roles (Admin access required)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns a list of all roles' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async getAllRoles() {
    return this.queryBus.execute(new GetRolesQuery());
  }

  @Get('permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Get all available permissions (Admin access required)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of all available permissions',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async getAllPermissions() {
    return this.queryBus.execute(new GetPermissionsQuery());
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Get role by ID (Admin access required)' })
  @ApiParam({ name: 'id', description: 'Role ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns role information' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async getRoleById(@Param('id') id: string) {
    return this.queryBus.execute(new GetRoleQuery(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: Create new role (Admin access required)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Role created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async createRole(@Body() createRoleDto: CreateRoleRequest) {
    return this.commandBus.execute(
      new CreateRoleCommand(
        createRoleDto.name,
        createRoleDto.description,
        createRoleDto.isDefault,
        createRoleDto.permissionIds,
      ),
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Update role by ID (Admin access required)' })
  @ApiParam({ name: 'id', description: 'Role ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleRequest) {
    return this.commandBus.execute(
      new UpdateRoleCommand(id, updateRoleDto.name, updateRoleDto.description, updateRoleDto.isDefault),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Delete role by ID (Admin access required)' })
  @ApiParam({ name: 'id', description: 'Role ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Role deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async deleteRole(@Param('id') id: string, @CurrentUser() currentUser: IJwtPayload) {
    await this.commandBus.execute(new DeleteRoleCommand(id, currentUser.sub));

    return { message: 'Role deleted successfully' };
  }

  @Post(':roleId/permissions/:permissionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Assign permission to role (Admin access required)' })
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'permissionId',
    description: 'Permission ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permission assigned to role successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role or permission not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async assignPermissionToRole(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.commandBus.execute(new AssignPermissionCommand(roleId, permissionId));
  }

  @Delete(':roleId/permissions/:permissionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Remove permission from role (Admin access required)' })
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'permissionId',
    description: 'Permission ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permission removed from role successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role or permission not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async removePermissionFromRole(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.commandBus.execute(new RemovePermissionCommand(roleId, permissionId));
  }
}
