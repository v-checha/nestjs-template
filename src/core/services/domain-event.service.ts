import { Injectable } from '@nestjs/common';
import { DomainEvent, AggregateRoot } from '@core/events/domain-event.base';

/**
 * Domain Event Service for managing and dispatching domain events
 * This is a core DDD pattern for handling side effects and maintaining loose coupling
 */
@Injectable()
export class DomainEventService {
  private readonly eventHandlers = new Map<string, Array<(event: DomainEvent) => Promise<void>>>();

  /**
   * Register an event handler for a specific event type
   */
  registerHandler<T extends DomainEvent>(
    eventName: string,
    handler: (event: T) => Promise<void>,
  ): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }

    this.eventHandlers.get(eventName)!.push(handler as (event: DomainEvent) => Promise<void>);
  }

  /**
   * Dispatch all domain events from an aggregate root
   */
  async dispatchEventsFromAggregate(aggregate: AggregateRoot): Promise<void> {
    const events = aggregate.getDomainEvents();

    // Clear events from aggregate to prevent double processing
    aggregate.clearDomainEvents();

    // Process events sequentially to maintain consistency
    for (const event of events) {
      await this.dispatchEvent(event);
    }
  }

  /**
   * Dispatch multiple aggregates' events in a transaction-like manner
   */
  async dispatchEventsFromAggregates(aggregates: AggregateRoot[]): Promise<void> {
    // Collect all events first
    const allEvents: DomainEvent[] = [];

    for (const aggregate of aggregates) {
      allEvents.push(...aggregate.getDomainEvents());
      aggregate.clearDomainEvents();
    }

    // Process all events
    for (const event of allEvents) {
      await this.dispatchEvent(event);
    }
  }

  /**
   * Dispatch a single domain event
   */
  async dispatchEvent(event: DomainEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.getEventName()) || [];

    // Execute all handlers for this event type
    const promises = handlers.map(handler => handler(event));

    try {
      await Promise.all(promises);
    } catch (error) {
      // Log error but don't throw to prevent transaction rollback
      console.error(`Error handling domain event ${event.getEventName()}:`, error);
      // In a real application, you'd use proper logging and potentially
      // implement a dead letter queue or retry mechanism
    }
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.eventHandlers.keys());
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clearAllHandlers(): void {
    this.eventHandlers.clear();
  }
}
