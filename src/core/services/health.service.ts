import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { LoggerService } from '@infrastructure/logger/logger.service';
import {
  IHealthResponse,
  IDatabaseHealthResponse,
  IReadinessResponse,
  ILivenessResponse,
  IHealthCheckDetail,
  IComprehensiveHealthResponse,
} from '@application/dtos/responses/health.response';
import {
  HealthCheckException,
  DatabaseConnectionException,
  ConfigurationException,
} from '@core/exceptions/domain-exceptions';

/**
 * Health Service - Domain service for application health monitoring
 * Implements comprehensive health checking following DDD principles
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Get basic application health status
   */
  async getHealth(): Promise<IHealthResponse> {
    this.logger.debug('Performing basic health check');

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      version: this.getApplicationVersion(),
    };
  }

  /**
   * Get database health status with connection validation
   */
  async getDatabaseHealth(): Promise<IDatabaseHealthResponse> {
    this.logger.debug('Performing database health check');

    try {
      const startTime = Date.now();
      await this.checkDatabase();
      const duration = Date.now() - startTime;

      this.logger.debug(`Database health check completed in ${duration}ms`);

      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        'Database health check failed',
        undefined,
        JSON.stringify({ error: error.message }),
      );
      throw new DatabaseConnectionException('Database connection failed');
    }
  }

  /**
   * Kubernetes readiness probe - comprehensive service readiness
   */
  async getReadiness(): Promise<IReadinessResponse> {
    this.logger.debug('Performing readiness check');

    try {
      // Perform comprehensive readiness checks
      const checks = await Promise.allSettled([
        this.checkDatabase(),
        this.checkConfiguration(),
        this.checkExternalDependencies(),
      ]);

      const failedChecks = checks.filter(check => check.status === 'rejected');

      if (failedChecks.length > 0) {
        const failures = failedChecks.map((check, _index) =>
          check.status === 'rejected' ? check.reason?.message : 'Unknown error',
        );

        this.logger.error('Readiness check failed', undefined, JSON.stringify({ failures }));
        throw new HealthCheckException(`Service not ready: ${failures.join(', ')}`);
      }

      this.logger.debug('Readiness check passed');

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'ok',
          config: 'ok',
        },
      };
    } catch (error) {
      this.logger.error(
        'Readiness check failed',
        undefined,
        JSON.stringify({ error: error.message }),
      );
      throw new HealthCheckException('Service not ready');
    }
  }

  /**
   * Kubernetes liveness probe - basic service availability
   */
  async getLiveness(): Promise<ILivenessResponse> {
    this.logger.debug('Performing liveness check');

    // Liveness should be lightweight - just verify the process is responsive
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Comprehensive health check with detailed information
   */
  async getComprehensiveHealth(): Promise<IComprehensiveHealthResponse> {
    this.logger.debug('Performing comprehensive health check');

    const checks: IHealthCheckDetail[] = [];
    let overallStatus: 'ok' | 'degraded' | 'down' = 'ok';

    // Database check
    const dbCheck = await this.performHealthCheck('database', async () => {
      await this.checkDatabase();
    });
    checks.push(dbCheck);

    // Configuration check
    const configCheck = await this.performHealthCheck('configuration', async () => {
      await this.checkConfiguration();
    });
    checks.push(configCheck);

    // External dependencies check
    const externalCheck = await this.performHealthCheck('external-services', async () => {
      await this.checkExternalDependencies();
    });
    checks.push(externalCheck);

    // Memory usage check
    const memoryCheck = await this.performHealthCheck('memory', async () => {
      await this.checkMemoryUsage();
    });
    checks.push(memoryCheck);

    // Determine overall status
    const errorCount = checks.filter(check => check.status === 'error').length;
    if (errorCount > 0) {
      overallStatus = errorCount >= checks.length / 2 ? 'down' : 'degraded';
    }

    this.logger.debug(
      'Comprehensive health check completed',
      JSON.stringify({
        overallStatus,
        checksCount: checks.length,
        errorsCount: errorCount,
      }),
    );

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      version: this.getApplicationVersion(),
      checks,
    };
  }

  // Private helper methods

  private async checkDatabase(): Promise<void> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
    } catch (error) {
      throw new DatabaseConnectionException(`Database check failed: ${error.message}`);
    }
  }

  private async checkConfiguration(): Promise<void> {
    const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];
    const missing = requiredVars.filter(key => !this.configService.get(key));

    if (missing.length > 0) {
      throw new ConfigurationException(
        `Missing required environment variables: ${missing.join(', ')}`,
      );
    }
  }

  private async checkExternalDependencies(): Promise<void> {
    // Add checks for external services (Redis, S3, etc.) if used
    // For now, this is a placeholder that always passes
    await Promise.resolve();
  }

  private async checkMemoryUsage(): Promise<void> {
    const memUsage = process.memoryUsage();
    const maxHeapSize = memUsage.heapTotal;
    const usedHeap = memUsage.heapUsed;
    const heapUsagePercent = (usedHeap / maxHeapSize) * 100;

    // Warn if memory usage is over 90%
    if (heapUsagePercent > 90) {
      throw new Error(`High memory usage: ${heapUsagePercent.toFixed(2)}%`);
    }
  }

  private async performHealthCheck(
    name: string,
    checkFn: () => Promise<void>,
  ): Promise<IHealthCheckDetail> {
    const startTime = Date.now();

    try {
      await checkFn();
      const duration = Date.now() - startTime;

      return {
        name,
        status: 'ok',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        name,
        status: 'error',
        message: error.message,
        duration,
      };
    }
  }

  private getApplicationVersion(): string {
    return (
      this.configService.get<string>('npm_package_version') ||
      process.env.npm_package_version ||
      '1.0.0'
    );
  }
}
