import { Module } from '@nestjs/common';
import { DomainEventService } from './services/domain-event.service';
import { DomainValidationService } from './services/domain-validation.service';
import { UserAuthorizationService } from './services/user-authorization.service';
import { ApplicationEventService } from './services/application-event.service';
import { HealthService } from './services/health.service';
import { LoggerModule } from '@infrastructure/logger/logger.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';

/**
 * Core Domain Module
 * Contains all domain services and DDD infrastructure
 */
@Module({
  imports: [LoggerModule, ConfigModule, PrismaModule],
  providers: [
    DomainEventService,
    DomainValidationService,
    UserAuthorizationService,
    ApplicationEventService,
    HealthService,
  ],
  exports: [
    DomainEventService,
    DomainValidationService,
    UserAuthorizationService,
    ApplicationEventService,
    HealthService,
  ],
})
export class CoreModule {}
