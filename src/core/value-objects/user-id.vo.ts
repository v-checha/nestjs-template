import { EntityId } from './entity-id.vo';

export class UserId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): UserId {
    return new UserId(value || EntityId.generateId());
  }

  static fromString(value: string): UserId {
    return new UserId(value);
  }
}
