import { EntityId } from './entity-id.vo';

export class RoleId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): RoleId {
    return new RoleId(value || EntityId.generateId());
  }

  static fromString(value: string): RoleId {
    return new RoleId(value);
  }
}
