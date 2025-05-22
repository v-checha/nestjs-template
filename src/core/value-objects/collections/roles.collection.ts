import { Role } from '@core/entities/role.entity';
import { RoleId } from '@core/value-objects/role-id.vo';
import { PermissionsCollection } from './permissions.collection';
import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

/**
 * Value Object collection for managing roles
 * Provides business logic for role collections while maintaining immutability
 */
export class RolesCollection {
  private readonly _roles: readonly Role[];

  private constructor(roles: Role[]) {
    this.validateRoles(roles);
    this._roles = Object.freeze([...roles]);
  }

  /**
   * Create a new roles collection
   */
  static create(roles: Role[] = []): RolesCollection {
    return new RolesCollection(roles);
  }

  /**
   * Add a role to the collection
   */
  add(role: Role): RolesCollection {
    if (this.contains(role.id)) {
      throw new InvalidValueObjectException(`Role '${role.name}' already exists in collection`);
    }

    return new RolesCollection([...this._roles, role]);
  }

  /**
   * Remove a role from the collection
   */
  remove(roleId: RoleId): RolesCollection {
    const filteredRoles = this._roles.filter(r => !r.id.equals(roleId));

    if (filteredRoles.length === this._roles.length) {
      // Role not found, return same collection
      return this;
    }

    return new RolesCollection(filteredRoles);
  }

  /**
   * Check if collection contains a specific role
   */
  contains(roleId: RoleId): boolean {
    return this._roles.some(r => r.id.equals(roleId));
  }

  /**
   * Check if collection contains a role by name
   */
  containsByName(roleName: string): boolean {
    return this._roles.some(r => r.name.toLowerCase() === roleName.toLowerCase());
  }

  /**
   * Get role by ID
   */
  getById(roleId: RoleId): Role | undefined {
    return this._roles.find(r => r.id.equals(roleId));
  }

  /**
   * Get role by name
   */
  getByName(roleName: string): Role | undefined {
    return this._roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
  }

  /**
   * Get the default role
   */
  getDefaultRole(): Role | undefined {
    return this._roles.find(r => r.isDefault);
  }

  /**
   * Get all admin roles
   */
  getAdminRoles(): RolesCollection {
    const adminRoles = this._roles.filter(r => r.isAdminRole());

    return new RolesCollection(adminRoles);
  }

  /**
   * Get all non-admin roles
   */
  getNonAdminRoles(): RolesCollection {
    const nonAdminRoles = this._roles.filter(r => !r.isAdminRole());

    return new RolesCollection(nonAdminRoles);
  }

  /**
   * Get roles that can be deleted
   */
  getDeletableRoles(): RolesCollection {
    const deletableRoles = this._roles.filter(r => r.canBeDeleted());

    return new RolesCollection(deletableRoles);
  }

  /**
   * Get all role names
   */
  getRoleNames(): string[] {
    return this._roles.map(r => r.name);
  }

  /**
   * Get all permissions from all roles (combined)
   */
  getAllPermissions(): PermissionsCollection {
    const allPermissions = this._roles.flatMap(r => r.permissions);

    return PermissionsCollection.create(allPermissions);
  }

  /**
   * Check if collection has admin privileges
   */
  hasAdminPrivileges(): boolean {
    return this._roles.some(r => r.isAdminRole());
  }

  /**
   * Check if collection allows access to a specific resource and action
   */
  allowsAccess(resource: string, action: string): boolean {
    return this._roles.some(r => r.permissions.some(p => p.allowsAction(resource, action)));
  }

  /**
   * Check if collection has a specific permission by name
   */
  hasPermission(permissionName: string): boolean {
    return this._roles.some(r => r.hasPermissionByName(permissionName));
  }

  /**
   * Get the highest privilege level in the collection
   */
  getHighestPrivilegeLevel(): 'guest' | 'user' | 'admin' | 'superadmin' {
    if (this.hasPermission('system:admin')) {
      return 'superadmin';
    }

    if (this.hasAdminPrivileges()) {
      return 'admin';
    }

    if (this.size > 0) {
      return 'user';
    }

    return 'guest';
  }

  /**
   * Get roles sorted by privilege level (admin roles first)
   */
  sortByPrivilege(): RolesCollection {
    const sorted = [...this._roles].sort((a, b) => {
      // Admin roles first
      if (a.isAdminRole() && !b.isAdminRole()) return -1;
      if (!a.isAdminRole() && b.isAdminRole()) return 1;

      // Default role last among non-admin roles
      if (a.isDefault && !b.isDefault) return 1;
      if (!a.isDefault && b.isDefault) return -1;

      // Sort by name
      return a.name.localeCompare(b.name);
    });

    return new RolesCollection(sorted);
  }

  /**
   * Get the size of the collection
   */
  get size(): number {
    return this._roles.length;
  }

  /**
   * Check if collection is empty
   */
  get isEmpty(): boolean {
    return this._roles.length === 0;
  }

  /**
   * Get immutable array of roles
   */
  get roles(): readonly Role[] {
    return this._roles;
  }

  /**
   * Convert to array (for compatibility)
   */
  toArray(): Role[] {
    return [...this._roles];
  }

  /**
   * Create iterator for the collection
   */
  *[Symbol.iterator](): Iterator<Role> {
    for (const role of this._roles) {
      yield role;
    }
  }

  /**
   * Merge with another roles collection
   */
  merge(other: RolesCollection): RolesCollection {
    const merged = [...this._roles];

    for (const role of other._roles) {
      if (!this.contains(role.id)) {
        merged.push(role);
      }
    }

    return new RolesCollection(merged);
  }

  /**
   * Get intersection with another roles collection
   */
  intersect(other: RolesCollection): RolesCollection {
    const intersection = this._roles.filter(r => other.contains(r.id));

    return new RolesCollection(intersection);
  }

  /**
   * Check if collection equals another collection
   */
  equals(other: RolesCollection): boolean {
    if (this.size !== other.size) {
      return false;
    }

    return this._roles.every(r => other.contains(r.id));
  }

  /**
   * Apply a filter predicate
   */
  filter(predicate: (role: Role) => boolean): RolesCollection {
    const filtered = this._roles.filter(predicate);

    return new RolesCollection(filtered);
  }

  /**
   * Find first role matching predicate
   */
  find(predicate: (role: Role) => boolean): Role | undefined {
    return this._roles.find(predicate);
  }

  /**
   * Check if any role matches predicate
   */
  some(predicate: (role: Role) => boolean): boolean {
    return this._roles.some(predicate);
  }

  /**
   * Check if all roles match predicate
   */
  every(predicate: (role: Role) => boolean): boolean {
    return this._roles.every(predicate);
  }

  private validateRoles(roles: Role[]): void {
    // Check for duplicate role IDs
    const roleIds = new Set<string>();
    const roleNames = new Set<string>();
    let defaultRoleCount = 0;

    for (const role of roles) {
      const id = role.id.getValue();
      const name = role.name.toLowerCase();

      if (roleIds.has(id)) {
        throw new InvalidValueObjectException(`Duplicate role ID: ${id}`);
      }

      if (roleNames.has(name)) {
        throw new InvalidValueObjectException(`Duplicate role name: ${role.name}`);
      }

      if (role.isDefault) {
        defaultRoleCount++;
      }

      roleIds.add(id);
      roleNames.add(name);
    }

    // Validate only one default role
    if (defaultRoleCount > 1) {
      throw new InvalidValueObjectException('Cannot have more than one default role');
    }
  }
}
