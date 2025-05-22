import { Permission } from '@core/entities/permission.entity';
import { PermissionId } from '@core/value-objects/permission-id.vo';
import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

/**
 * Value Object collection for managing permissions
 * Provides business logic for permission collections while maintaining immutability
 */
export class PermissionsCollection {
  private readonly _permissions: readonly Permission[];

  private constructor(permissions: Permission[]) {
    this.validatePermissions(permissions);
    this._permissions = Object.freeze([...permissions]);
  }

  /**
   * Create a new permissions collection
   */
  static create(permissions: Permission[] = []): PermissionsCollection {
    return new PermissionsCollection(permissions);
  }

  /**
   * Add a permission to the collection
   */
  add(permission: Permission): PermissionsCollection {
    if (this.contains(permission.id)) {
      throw new InvalidValueObjectException(
        `Permission '${permission.getPermissionName()}' already exists in collection`,
      );
    }

    return new PermissionsCollection([...this._permissions, permission]);
  }

  /**
   * Remove a permission from the collection
   */
  remove(permissionId: PermissionId): PermissionsCollection {
    const filteredPermissions = this._permissions.filter(p => !p.id.equals(permissionId));

    if (filteredPermissions.length === this._permissions.length) {
      // Permission not found, return same collection
      return this;
    }

    return new PermissionsCollection(filteredPermissions);
  }

  /**
   * Check if collection contains a specific permission
   */
  contains(permissionId: PermissionId): boolean {
    return this._permissions.some(p => p.id.equals(permissionId));
  }

  /**
   * Check if collection contains a permission by name
   */
  containsByName(permissionName: string): boolean {
    return this._permissions.some(p => p.getPermissionName() === permissionName);
  }

  /**
   * Get permission by ID
   */
  getById(permissionId: PermissionId): Permission | undefined {
    return this._permissions.find(p => p.id.equals(permissionId));
  }

  /**
   * Get permission by name
   */
  getByName(permissionName: string): Permission | undefined {
    return this._permissions.find(p => p.getPermissionName() === permissionName);
  }

  /**
   * Filter permissions by resource
   */
  filterByResource(resource: string): PermissionsCollection {
    const filtered = this._permissions.filter(
      p => p.getResource().toLowerCase() === resource.toLowerCase(),
    );

    return new PermissionsCollection(filtered);
  }

  /**
   * Filter permissions by action
   */
  filterByAction(action: string): PermissionsCollection {
    const filtered = this._permissions.filter(
      p => p.getAction().toLowerCase() === action.toLowerCase(),
    );

    return new PermissionsCollection(filtered);
  }

  /**
   * Get all resource names
   */
  getResources(): string[] {
    const resources = new Set(this._permissions.map(p => p.getResource()));

    return Array.from(resources);
  }

  /**
   * Get all action names
   */
  getActions(): string[] {
    const actions = new Set(this._permissions.map(p => p.getAction()));

    return Array.from(actions);
  }

  /**
   * Get all permission names
   */
  getPermissionNames(): string[] {
    return this._permissions.map(p => p.getPermissionName());
  }

  /**
   * Check if collection has admin permissions
   */
  hasAdminPermissions(): boolean {
    const adminResources = ['user', 'role', 'permission', 'system'];
    const criticalActions = ['create', 'update', 'delete'];

    return this._permissions.some(p => {
      const resource = p.getResource().toLowerCase();
      const action = p.getAction().toLowerCase();

      return adminResources.includes(resource) && criticalActions.includes(action);
    });
  }

  /**
   * Check if collection allows access to a specific resource and action
   */
  allowsAccess(resource: string, action: string): boolean {
    return this._permissions.some(p => p.allowsAction(resource, action));
  }

  /**
   * Get the size of the collection
   */
  get size(): number {
    return this._permissions.length;
  }

  /**
   * Check if collection is empty
   */
  get isEmpty(): boolean {
    return this._permissions.length === 0;
  }

  /**
   * Get immutable array of permissions
   */
  get permissions(): readonly Permission[] {
    return this._permissions;
  }

  /**
   * Convert to array (for compatibility)
   */
  toArray(): Permission[] {
    return [...this._permissions];
  }

  /**
   * Create iterator for the collection
   */
  *[Symbol.iterator](): Iterator<Permission> {
    for (const permission of this._permissions) {
      yield permission;
    }
  }

  /**
   * Merge with another permissions collection
   */
  merge(other: PermissionsCollection): PermissionsCollection {
    const merged = [...this._permissions];

    for (const permission of other._permissions) {
      if (!this.contains(permission.id)) {
        merged.push(permission);
      }
    }

    return new PermissionsCollection(merged);
  }

  /**
   * Get intersection with another permissions collection
   */
  intersect(other: PermissionsCollection): PermissionsCollection {
    const intersection = this._permissions.filter(p => other.contains(p.id));

    return new PermissionsCollection(intersection);
  }

  /**
   * Check if collection equals another collection
   */
  equals(other: PermissionsCollection): boolean {
    if (this.size !== other.size) {
      return false;
    }

    return this._permissions.every(p => other.contains(p.id));
  }

  private validatePermissions(permissions: Permission[]): void {
    // Check for duplicates
    const permissionIds = new Set<string>();
    const permissionNames = new Set<string>();

    for (const permission of permissions) {
      const id = permission.id.getValue();
      const name = permission.getPermissionName();

      if (permissionIds.has(id)) {
        throw new InvalidValueObjectException(`Duplicate permission ID: ${id}`);
      }

      if (permissionNames.has(name)) {
        throw new InvalidValueObjectException(`Duplicate permission name: ${name}`);
      }

      permissionIds.add(id);
      permissionNames.add(name);
    }
  }
}
