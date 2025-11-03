import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

export enum ResourceType {
  USER = 'user',
  ROLE = 'role',
  STORAGE = 'storage',
  AUDIT = 'audit',
}

export enum ActionType {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export class ResourceAction {
  private readonly resource: string;
  private readonly action: ActionType;

  constructor(resource: ResourceType | string, action: ActionType | string) {
    const resourceValue = typeof resource === 'string' ? this.parseResourceType(resource) : resource;

    if (!this.isValidResource(resourceValue)) {
      throw new InvalidValueObjectException('Invalid resource name');
    }

    const actionValue = typeof action === 'string' ? this.parseActionType(action) : action;

    this.resource = resourceValue.toLowerCase();
    this.action = actionValue;
  }

  private isValidResource(resource: string): boolean {
    // Resource name should be lowercase alphanumeric and cannot be empty
    return /^[a-z0-9-]+$/.test(resource) && resource.length > 0;
  }

  private parseResourceType(resource: string): ResourceType {
    if (Object.values(ResourceType).includes(resource as ResourceType)) {
      return resource as ResourceType;
    }
    throw new InvalidValueObjectException('Invalid resource type');
  }

  private parseActionType(action: string): ActionType {
    if (Object.values(ActionType).includes(action as ActionType)) {
      return action as ActionType;
    }
    throw new InvalidValueObjectException('Invalid action type');
  }

  getResource(): string {
    return this.resource;
  }

  getAction(): ActionType {
    return this.action;
  }
}
