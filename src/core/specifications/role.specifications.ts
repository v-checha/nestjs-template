import { Specification } from './specification.base';
import { Role } from '@core/entities/role.entity';
import { Permission } from '@core/entities/permission.entity';
import { PermissionId } from '@core/value-objects/permission-id.vo';

/**
 * Specification to check if a role is the default role
 */
export class DefaultRoleSpecification extends Specification<Role> {
  isSatisfiedBy(role: Role): boolean {
    return role.isDefault;
  }
}

/**
 * Specification to check if a role is an admin role
 */
export class AdminRoleSpecification extends Specification<Role> {
  isSatisfiedBy(role: Role): boolean {
    return role.isAdminRole();
  }
}

/**
 * Specification to check if a role has a specific permission
 */
export class RoleHasPermissionSpecification extends Specification<Role> {
  constructor(private readonly permissionId: PermissionId) {
    super();
  }

  isSatisfiedBy(role: Role): boolean {
    return role.hasPermission(this.permissionId);
  }
}

/**
 * Specification to check if a role has permissions by name
 */
export class RoleHasPermissionByNameSpecification extends Specification<Role> {
  constructor(private readonly permissionName: string) {
    super();
  }

  isSatisfiedBy(role: Role): boolean {
    return role.hasPermissionByName(this.permissionName);
  }
}

/**
 * Specification to check if a role can be deleted
 */
export class CanDeleteRoleSpecification extends Specification<Role> {
  isSatisfiedBy(role: Role): boolean {
    return role.canBeDeleted();
  }
}

/**
 * Specification to check if a permission can be assigned to a role
 */
export class CanAssignPermissionToRoleSpecification extends Specification<Role> {
  constructor(private readonly permission: Permission) {
    super();
  }

  isSatisfiedBy(role: Role): boolean {
    // Permission is not already assigned
    if (role.hasPermission(this.permission.id)) {
      return false;
    }

    // Additional business rules can be added here
    // For example: certain permissions might require admin roles
    if (this.isSystemAdminPermission(this.permission) && !role.isAdminRole()) {
      return false;
    }

    return true;
  }

  private isSystemAdminPermission(permission: Permission): boolean {
    // Business rule: System admin permissions require admin roles
    const adminResources = ['user', 'role', 'permission', 'system'];
    const criticalActions = ['delete', 'create', 'update'];

    return (
      adminResources.includes(permission.getResource().toLowerCase()) &&
      criticalActions.includes(permission.getAction().toLowerCase())
    );
  }
}

/**
 * Specification to check if a role has minimum required permissions
 */
export class HasMinimumPermissionsSpecification extends Specification<Role> {
  constructor(private readonly minimumCount: number = 1) {
    super();
  }

  isSatisfiedBy(role: Role): boolean {
    return role.permissions.length >= this.minimumCount;
  }
}

/**
 * Specification to check if a role is a basic user role
 */
export class BasicUserRoleSpecification extends Specification<Role> {
  isSatisfiedBy(role: Role): boolean {
    return (
      !role.isAdminRole() &&
      !role.isDefault &&
      role.permissions.length > 0 &&
      role.permissions.length <= 10 // Basic roles shouldn't have too many permissions
    );
  }
}
