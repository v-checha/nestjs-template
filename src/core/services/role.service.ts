import { Injectable, Inject } from '@nestjs/common';
import { Role } from '../entities/role.entity';
import { IRoleRepository } from '../repositories/role.repository.interface';
import { IPermissionRepository } from '../repositories/permission.repository.interface';
import { IUserRepository } from '../repositories/user.repository.interface';
import {
  EntityNotFoundException,
  EntityAlreadyExistsException,
  ForbiddenActionException,
} from '@core/exceptions/domain-exceptions';
import { PermissionId } from '@core/value-objects/permission-id.vo';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY, USER_REPOSITORY } from '@shared/constants/tokens';
import { UserAuthorizationService } from './user-authorization.service';

@Injectable()
export class RoleService {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly userAuthorizationService: UserAuthorizationService,
  ) {}

  async createRole(name: string, description: string, isDefault: boolean = false): Promise<Role> {
    // Check if a role already exists
    const existingRole = await this.roleRepository.findByName(name);
    if (existingRole) {
      throw new EntityAlreadyExistsException('Role', 'name');
    }

    // If this is a default role, unset any existing default role
    if (isDefault) {
      const currentDefaultRole = await this.roleRepository.findDefaultRole();
      if (currentDefaultRole) {
        currentDefaultRole.removeAsDefault();
        await this.roleRepository.update(currentDefaultRole);
      }
    }

    const role = Role.create(name, description, isDefault);

    return this.roleRepository.create(role);
  }

  async createRoleWithPermissions(
    name: string,
    description: string,
    permissionIds: string[],
    isDefault: boolean = false,
  ): Promise<Role> {
    // Check if a role already exists
    const existingRole = await this.roleRepository.findByName(name);
    if (existingRole) {
      throw new EntityAlreadyExistsException('Role', 'name');
    }

    // If this is a default role, unset any existing default role
    if (isDefault) {
      const currentDefaultRole = await this.roleRepository.findDefaultRole();
      if (currentDefaultRole) {
        currentDefaultRole.removeAsDefault();
        await this.roleRepository.update(currentDefaultRole);
      }
    }

    const role = Role.create(name, description, isDefault);

    // Get unique permission IDs and add permissions directly during creation
    const uniquePermissionIds = [...new Set(permissionIds)];
    const permissions = [];

    for (const permissionId of uniquePermissionIds) {
      const permission = await this.permissionRepository.findById(permissionId);
      if (!permission) {
        throw new EntityNotFoundException('Permission', permissionId);
      }
      permissions.push(permission);
    }

    // Add all permissions at once without validation
    role.addPermissionsOnCreation(permissions);

    return this.roleRepository.create(role);
  }

  async updateRole(id: string, name?: string, description?: string, isDefault?: boolean): Promise<Role> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new EntityNotFoundException('Role', id);
    }

    if (name) {
      const existingRole = await this.roleRepository.findByName(name);
      if (existingRole && existingRole.id.getValue() !== id) {
        throw new EntityAlreadyExistsException('Role', 'name');
      }
    }

    role.updateDetails(name, description);

    if (isDefault !== undefined) {
      // If making this role default, unset any existing default role
      if (isDefault && !role.isDefault) {
        const currentDefaultRole = await this.roleRepository.findDefaultRole();
        if (currentDefaultRole && currentDefaultRole.id.getValue() !== id) {
          currentDefaultRole.removeAsDefault();
          await this.roleRepository.update(currentDefaultRole);
        }
      }
      if (isDefault) {
        role.setAsDefault();
      } else {
        role.removeAsDefault();
      }
    }

    // The entity will handle updating the updatedAt timestamp

    return this.roleRepository.update(role);
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new EntityNotFoundException('Role', roleId);
    }

    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) {
      throw new EntityNotFoundException('Permission', permissionId);
    }

    role.addPermission(permission);

    return this.roleRepository.update(role);
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new EntityNotFoundException('Role', roleId);
    }

    role.removePermission(PermissionId.fromString(permissionId));

    return this.roleRepository.update(role);
  }

  async deleteRole(id: string, deleterId?: string): Promise<boolean> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new EntityNotFoundException('Role', id);
    }

    // If deleterId is provided, check authorization
    if (deleterId) {
      const deleterUser = await this.userRepository.findById(deleterId);
      if (!deleterUser) {
        throw new EntityNotFoundException('User', deleterId);
      }

      // Check if the deleter can delete this role
      if (!this.userAuthorizationService.canDeleteRole(deleterUser, role)) {
        throw new ForbiddenActionException('You are not authorized to delete this role');
      }
    }

    if (role.isDefault) {
      throw new ForbiddenActionException('Cannot delete the default role');
    }

    return this.roleRepository.delete(id);
  }
}
