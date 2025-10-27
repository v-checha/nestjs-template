import { RoleDetailResponse } from '@application/dtos';
import { RoleMapper } from '@application/mappers/role.mapper';
import { IRoleRepository } from '@core/repositories/role.repository.interface';
import { RoleService } from '@core/services/role.service';
import { Inject } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ROLE_REPOSITORY } from '@shared/constants/tokens';

export class RemovePermissionCommand extends Command<RoleDetailResponse> {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
  ) {
    super();
  }
}

@CommandHandler(RemovePermissionCommand)
export class RemovePermissionCommandHandler implements ICommandHandler<RemovePermissionCommand> {
  constructor(
    private readonly roleService: RoleService,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: RemovePermissionCommand) {
    const { roleId, permissionId } = command;

    // Remove the permission from the role
    const role = await this.roleService.removePermissionFromRole(roleId, permissionId);

    // Fetch the updated role with permissions
    const updatedRole = await this.roleRepository.findById(role.id.getValue());

    if (!updatedRole) {
      throw new Error('Role not found after update');
    }

    // Use the mapper to convert to response DTO
    return RoleMapper.toDetailResponse(updatedRole);
  }
}
