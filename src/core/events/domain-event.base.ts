import { v4 as uuidv4 } from 'uuid';

/**
 * Base class for all domain events
 */
export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventVersion: number;

  constructor(version: number = 1) {
    this.eventId = uuidv4();
    this.occurredOn = new Date();
    this.eventVersion = version;
  }

  abstract getEventName(): string;
}

/**
 * Mixin for entities that can raise domain events
 */
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}
