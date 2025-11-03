import { Injectable } from '@nestjs/common';
import { User } from '@core/entities/user.entity';
import { Role } from '@core/entities/role.entity';
import {
  ActiveUserSpecification,
  TwoFactorEnabledSpecification,
  AdminUserSpecification,
  UserHasPermissionSpecification,
  CanAssignRoleSpecification,
  CompleteUserAccountSpecification,
} from '@core/specifications/user.specifications';
import { AdminRoleSpecification, CanDeleteRoleSpecification } from '@core/specifications/role.specifications';

/**
 * Domain service for user authorization and access control business logic
 * Uses the Specification pattern to encapsulate complex business rules
 */
@Injectable()
export class UserAuthorizationService {
  /**
   * Check if a user can access admin features
   */
  canAccessAdminFeatures(user: User): boolean {
    const activeUserSpec = new ActiveUserSpecification();
    const adminUserSpec = new AdminUserSpecification();
    const completeAccountSpec = new CompleteUserAccountSpecification();

    // Combine specifications: user must be active, have admin role, and complete account
    const adminAccessSpec = activeUserSpec.and(adminUserSpec).and(completeAccountSpec);

    return adminAccessSpec.isSatisfiedBy(user);
  }

  /**
   * Check if a user can perform sensitive operations (requires 2FA)
   */
  canPerformSensitiveOperations(user: User): boolean {
    const activeUserSpec = new ActiveUserSpecification();
    const twoFactorSpec = new TwoFactorEnabledSpecification();

    // Combine specifications: user must be active and have 2FA enabled
    const sensitiveOperationSpec = activeUserSpec.and(twoFactorSpec);

    return sensitiveOperationSpec.isSatisfiedBy(user);
  }

  /**
   * Check if a user can assign a specific role to another user
   */
  canAssignRole(assignerUser: User, targetUser: User, role: Role): boolean {
    // Only active admin users can assign roles
    if (!this.canAccessAdminFeatures(assignerUser)) {
      return false;
    }

    // Check if the target user can receive this role
    const canAssignRoleSpec = new CanAssignRoleSpecification(role);
    if (!canAssignRoleSpec.isSatisfiedBy(targetUser)) {
      return false;
    }

    // Additional rule: only super admins can assign admin roles
    const adminRoleSpec = new AdminRoleSpecification();
    if (adminRoleSpec.isSatisfiedBy(role)) {
      const assignerPermissionSpec = new UserHasPermissionSpecification('role:update');

      return assignerPermissionSpec.isSatisfiedBy(assignerUser);
    }

    return true;
  }

  /**
   * Check if a user can delete a role
   */
  canDeleteRole(user: User, role: Role): boolean {
    // Only admin users can delete roles
    if (!this.canAccessAdminFeatures(user)) {
      return false;
    }

    // Cannot delete default roles
    const canDeleteSpec = new CanDeleteRoleSpecification();
    if (!canDeleteSpec.isSatisfiedBy(role)) {
      return false;
    }

    // Super admins can delete any non-default role
    const superAdminPermissionSpec = new UserHasPermissionSpecification('role:delete');

    return superAdminPermissionSpec.isSatisfiedBy(user);
  }

  /**
   * Check if a user can access a specific resource
   */
  canAccessResource(user: User, resource: string, action: string): boolean {
    const activeUserSpec = new ActiveUserSpecification();
    if (!activeUserSpec.isSatisfiedBy(user)) {
      return false;
    }

    // Build permission name from resource and action
    const permissionName = `${resource}:${action}`;
    const hasPermissionSpec = new UserHasPermissionSpecification(permissionName);

    return hasPermissionSpec.isSatisfiedBy(user);
  }
}
