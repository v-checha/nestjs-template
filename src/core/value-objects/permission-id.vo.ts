import { EntityId } from './entity-id.vo';

export class PermissionId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): PermissionId {
    return new PermissionId(value || EntityId.generateId());
  }

  static fromString(value: string): PermissionId {
    return new PermissionId(value);
  }
}
