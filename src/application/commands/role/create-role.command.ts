import { RoleDetailResponse } from '@application/dtos';
import { RoleMapper } from '@application/mappers/role.mapper';
import { Role } from '@core/entities/role.entity';
import { IRoleRepository } from '@core/repositories/role.repository.interface';
import { RoleService } from '@core/services/role.service';
import { Inject } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ROLE_REPOSITORY } from '@shared/constants/tokens';

export class CreateRoleCommand extends Command<RoleDetailResponse> {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly isDefault?: boolean,
    public readonly permissionIds?: string[],
  ) {
    super();
  }
}

@CommandHandler(CreateRoleCommand)
export class CreateRoleCommandHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    private readonly roleService: RoleService,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: CreateRoleCommand) {
    const { name, description, isDefault, permissionIds } = command;

    let role: Role;

    // If permission IDs are provided, create role with permissions in one step
    if (permissionIds && permissionIds.length > 0) {
      role = await this.roleService.createRoleWithPermissions(name, description, permissionIds, isDefault);
    } else {
      // Create the role without permissions
      role = await this.roleService.createRole(name, description, isDefault);
    }

    // Use the mapper to convert to response DTO
    return RoleMapper.toDetailResponse(role);
  }
}
