import { Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEventService } from './domain-event.service';
import {
  UserRegisteredEvent,
  UserActivatedEvent,
  UserRoleAssignedEvent,
  UserTwoFactorEnabledEvent,
} from '@core/events/user.events';
import { LoggerService } from '@infrastructure/logger/logger.service';
import { User } from '@core/entities/user.entity';

/**
 * Application Event Service that registers domain event handlers
 * This demonstrates how to use the DomainEventService in practice
 */
@Injectable()
export class ApplicationEventService implements OnModuleInit {
  constructor(
    private readonly domainEventService: DomainEventService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    // Register handler for user registration
    this.domainEventService.registerHandler(
      'UserRegisteredEvent',
      async (event: UserRegisteredEvent) => {
        this.logger.log({
          message: 'User registered',
          userId: event.userId.getValue(),
          email: event.email,
          eventId: event.eventId,
        });
        // Here you could add additional side effects like:
        // - Send welcome email
        // - Create user profile
        // - Initialize user preferences
      },
    );

    // Register handler for user activation
    this.domainEventService.registerHandler(
      'UserActivatedEvent',
      async (event: UserActivatedEvent) => {
        this.logger.log({
          message: 'User activated',
          userId: event.userId.getValue(),
          eventId: event.eventId,
        });
        // Here you could add additional side effects like:
        // - Send activation confirmation email
        // - Enable user features
        // - Update analytics
      },
    );

    // Register handler for role assignment
    this.domainEventService.registerHandler(
      'UserRoleAssignedEvent',
      async (event: UserRoleAssignedEvent) => {
        this.logger.log({
          message: 'Role assigned to user',
          userId: event.userId.getValue(),
          roleId: event.roleId.getValue(),
          roleName: event.roleName,
          eventId: event.eventId,
        });
        // Here you could add additional side effects like:
        // - Invalidate permission cache
        // - Send notification to admin
        // - Update user session
      },
    );

    // Register handler for 2FA enablement
    this.domainEventService.registerHandler(
      'UserTwoFactorEnabledEvent',
      async (event: UserTwoFactorEnabledEvent) => {
        this.logger.log({
          message: 'Two-factor authentication enabled',
          userId: event.userId.getValue(),
          eventId: event.eventId,
        });
        // Here you could add additional side effects like:
        // - Send security notification email
        // - Update security audit log
        // - Generate backup codes
      },
    );
  }

  /**
   * Dispatch events from a user entity (example usage)
   */
  async dispatchUserEvents(user: User): Promise<void> {
    await this.domainEventService.dispatchEventsFromAggregate(user);
  }
}
