import { EntityId } from './entity-id.vo';

export class FileId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): FileId {
    return new FileId(value || EntityId.generateId());
  }

  static fromString(value: string): FileId {
    return new FileId(value);
  }
}
