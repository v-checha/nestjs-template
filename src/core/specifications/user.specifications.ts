import { Specification } from './specification.base';
import { User } from '@core/entities/user.entity';
import { Role } from '@core/entities/role.entity';

/**
 * Specification to check if a user is active
 */
export class ActiveUserSpecification extends Specification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.isActive;
  }
}

/**
 * Specification to check if a user has 2FA enabled
 */
export class TwoFactorEnabledSpecification extends Specification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.otpEnabled;
  }
}

/**
 * Specification to check if a user has admin privileges
 */
export class AdminUserSpecification extends Specification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.roles.some((role) => role.isAdminRole());
  }
}

/**
 * Specification to check if a user is eligible for admin role assignment
 */
export class EligibleForAdminRoleSpecification extends Specification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.isEligibleForAdminRole();
  }
}

/**
 * Specification to check if a user has a specific permission
 */
export class UserHasPermissionSpecification extends Specification<User> {
  constructor(private readonly permissionName: string) {
    super();
  }

  isSatisfiedBy(user: User): boolean {
    return user.hasPermission(this.permissionName);
  }
}

/**
 * Specification to check if a user can be assigned a role
 */
export class CanAssignRoleSpecification extends Specification<User> {
  constructor(private readonly role: Role) {
    super();
  }

  isSatisfiedBy(user: User): boolean {
    if (!user.isActive) {
      return false;
    }

    if (user.hasRole(this.role.id)) {
      return false; // Already has the role
    }

    // Admin roles require special eligibility
    if (this.role.isAdminRole() && !user.isEligibleForAdminRole()) {
      return false;
    }

    return true;
  }
}

/**
 * Specification to check if a user account is complete
 */
export class CompleteUserAccountSpecification extends Specification<User> {
  isSatisfiedBy(user: User): boolean {
    return (
      user.isActive &&
      user.email.getValue().length > 0 &&
      user.firstName.getValue().length > 0 &&
      user.lastName.getValue().length > 0 &&
      user.roles.length > 0
    );
  }
}
