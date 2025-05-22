import { HttpException, HttpStatus } from '@nestjs/common';

// Base domain exception class
export class DomainException extends HttpException {
  constructor(message: string, status: HttpStatus) {
    super(message, status);
    this.name = this.constructor.name;
  }
}

// Entity not found
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id?: string) {
    const message = id ? `${entityName} with ID ${id} not found` : `${entityName} not found`;
    super(message, HttpStatus.NOT_FOUND);
  }
}

// Entity already exists
export class EntityAlreadyExistsException extends DomainException {
  constructor(entityName: string, identifier?: string) {
    const message = identifier
      ? `${entityName} with this ${identifier} already exists`
      : `${entityName} already exists`;
    super(message, HttpStatus.CONFLICT);
  }
}

// Invalid input
export class InvalidInputException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

// Authentication exceptions
export class AuthenticationException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

// OTP exceptions
export class OtpExpiredException extends DomainException {
  constructor() {
    super('OTP has expired', HttpStatus.BAD_REQUEST);
  }
}

export class OtpInvalidException extends DomainException {
  constructor() {
    super('Invalid OTP', HttpStatus.BAD_REQUEST);
  }
}

// Forbidden action
export class ForbiddenActionException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN);
  }
}

// Value object exceptions
export class InvalidValueObjectException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

// Throttling exceptions
export class ThrottlingException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class InvalidThrottleIdentifierException extends DomainException {
  constructor() {
    super('Throttle identifier cannot be empty', HttpStatus.BAD_REQUEST);
  }
}

// Domain-specific exception hierarchies
export abstract class UserDomainException extends DomainException {}
export abstract class RoleDomainException extends DomainException {}
export abstract class AuthenticationDomainException extends DomainException {}
export abstract class FileDomainException extends DomainException {}

// User domain exceptions
export class UserNotEligibleForRoleException extends UserDomainException {
  constructor(userId: string, roleName: string) {
    super(`User ${userId} is not eligible for role: ${roleName}`, HttpStatus.FORBIDDEN);
  }
}

export class UserAlreadyHasRoleException extends UserDomainException {
  constructor(userId: string, roleName: string) {
    super(`User ${userId} already has role: ${roleName}`, HttpStatus.CONFLICT);
  }
}

export class InactiveUserException extends UserDomainException {
  constructor(operation: string) {
    super(`Cannot ${operation} for inactive user`, HttpStatus.FORBIDDEN);
  }
}

export class UserCannotRemoveLastRoleException extends UserDomainException {
  constructor() {
    super('Cannot remove the last role from user', HttpStatus.FORBIDDEN);
  }
}

// Role domain exceptions
export class CannotDeleteDefaultRoleException extends RoleDomainException {
  constructor() {
    super('Cannot delete default role', HttpStatus.FORBIDDEN);
  }
}

export class RoleHasAssignedUsersException extends RoleDomainException {
  constructor(roleName: string) {
    super(`Cannot delete role ${roleName} as it has assigned users`, HttpStatus.CONFLICT);
  }
}

export class PermissionAlreadyAssignedException extends RoleDomainException {
  constructor(permissionName: string, roleName: string) {
    super(
      `Permission ${permissionName} is already assigned to role ${roleName}`,
      HttpStatus.CONFLICT,
    );
  }
}

// Authentication domain exceptions
export class InvalidCredentialsException extends AuthenticationDomainException {
  constructor() {
    super('Invalid credentials provided', HttpStatus.UNAUTHORIZED);
  }
}

export class AccountLockedException extends AuthenticationDomainException {
  constructor() {
    super('Account is locked', HttpStatus.FORBIDDEN);
  }
}

export class TwoFactorRequiredException extends AuthenticationDomainException {
  constructor() {
    super('Two-factor authentication required', HttpStatus.UNAUTHORIZED);
  }
}

// File domain exceptions
export class FileNotOwnedByUserException extends FileDomainException {
  constructor(fileId: string, userId: string) {
    super(`File ${fileId} is not owned by user ${userId}`, HttpStatus.FORBIDDEN);
  }
}

export class FileAccessDeniedException extends FileDomainException {
  constructor(fileId: string) {
    super(`Access denied to file ${fileId}`, HttpStatus.FORBIDDEN);
  }
}

export class InvalidFileOperationException extends FileDomainException {
  constructor(operation: string, reason: string) {
    super(`Cannot ${operation}: ${reason}`, HttpStatus.BAD_REQUEST);
  }
}

// Validation exceptions
export class BusinessRuleValidationException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
    this.name = 'BusinessRuleValidationException';
  }
}

// Health check exceptions
export class HealthCheckException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
    this.name = 'HealthCheckException';
  }
}

export class DatabaseConnectionException extends HealthCheckException {
  constructor(message: string) {
    super(`Database connection error: ${message}`);
    this.name = 'DatabaseConnectionException';
  }
}

export class ConfigurationException extends HealthCheckException {
  constructor(message: string) {
    super(`Configuration error: ${message}`);
    this.name = 'ConfigurationException';
  }
}
