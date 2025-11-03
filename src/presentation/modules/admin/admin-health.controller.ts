import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Guards & Decorators
import { PermissionsGuard } from '@presentation/guards/permissions.guard';
import { RequiresAdmin } from '@shared/decorators/admin.decorator';

// Queries
import { AdminGetHealthQuery } from '@application/queries/admin/get-health.query';
import { GetDatabaseHealthQuery } from '@application/queries/health/get-database-health.query';
import { GetReadinessQuery } from '@application/queries/health/get-readiness.query';
import { GetLivenessQuery } from '@application/queries/health/get-liveness.query';

// Response interfaces
import { HealthCheckResponse, DatabaseHealthResponse, ReadinessResponse, LivenessResponse } from '@application/dtos';

@ApiTags('admin-health')
@Controller('admin/health')
@UseGuards(PermissionsGuard)
@RequiresAdmin()
@ApiBearerAuth('JWT-auth')
export class AdminHealthController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: System health check (Admin access required)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service health information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 12345.67 },
        environment: { type: 'string', example: 'development' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async getHealth(): Promise<HealthCheckResponse> {
    return this.queryBus.execute(new AdminGetHealthQuery());
  }

  @Get('database')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Database health check (Admin access required)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Database health information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        database: { type: 'string', example: 'connected' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Database is unhealthy',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async getDatabaseHealth(): Promise<DatabaseHealthResponse> {
    return this.queryBus.execute(new GetDatabaseHealthQuery());
  }

  @Get('readiness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: System readiness check (Admin access required)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service readiness information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ready' },
        timestamp: { type: 'string', format: 'date-time' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'string', example: 'ok' },
            config: { type: 'string', example: 'ok' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Service is not ready',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async getReadiness(): Promise<ReadinessResponse> {
    return this.queryBus.execute(new GetReadinessQuery());
  }

  @Get('liveness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: System liveness check (Admin access required)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service liveness information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'alive' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 12345.67 },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async getLiveness(): Promise<LivenessResponse> {
    return this.queryBus.execute(new GetLivenessQuery());
  }
}
