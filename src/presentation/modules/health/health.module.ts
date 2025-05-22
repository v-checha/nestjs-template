import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { HealthController } from './health.controller';

// Core Module for domain services
import { CoreModule } from '@core/core.module';

// Query Handlers
import { GetHealthQueryHandler } from '@application/queries/health/get-health.query';
import { GetDatabaseHealthQueryHandler } from '@application/queries/health/get-database-health.query';
import { GetReadinessQueryHandler } from '@application/queries/health/get-readiness.query';
import { GetLivenessQueryHandler } from '@application/queries/health/get-liveness.query';

const queryHandlers = [
  GetHealthQueryHandler,
  GetDatabaseHealthQueryHandler,
  GetReadinessQueryHandler,
  GetLivenessQueryHandler,
];

@Module({
  imports: [CqrsModule, CoreModule],
  controllers: [HealthController],
  providers: [
    // Query handlers
    ...queryHandlers,
  ],
})
export class HealthModule {}
