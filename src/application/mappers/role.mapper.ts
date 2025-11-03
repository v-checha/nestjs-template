import { Role } from '@core/entities/role.entity';
import { Permission } from '@core/entities/permission.entity';
import { RoleDetailResponse, PermissionResponse } from '@application/dtos';

export class RoleMapper {
  /**
   * Maps a Permission entity to a PermissionResponse DTO
   */
  static toPermissionResponse(permission: Permission): PermissionResponse {
    return {
      id: permission.id.getValue(),
      name: permission.getPermissionName(),
      description: permission.description,
      resource: permission.getResource(),
      action: permission.getAction(),
    };
  }

  /**
   * Maps a Role entity to a RoleDetailResponse DTO
   */
  static toDetailResponse(role: Role): RoleDetailResponse {
    return {
      id: role.id.getValue(),
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
      permissions: role.permissions?.map((permission) => this.toPermissionResponse(permission)) || [],
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
