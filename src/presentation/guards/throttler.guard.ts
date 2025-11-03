import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ThrottlerService } from '@infrastructure/services/throttler.service';
import { ThrottleLimit } from '@core/value-objects/throttle-limit.vo';
import { THROTTLE_KEY, SKIP_THROTTLE_KEY } from '@shared/decorators/throttle.decorator';

@Injectable()
export class ThrottlerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly throttlerService: ThrottlerService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if we should skip throttling for this handler
    const skipThrottle = this.reflector.getAllAndOverride<boolean>(SKIP_THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipThrottle) {
      return true;
    }

    // Get custom throttle settings if provided, or use defaults
    const throttleConfig = this.reflector.getAllAndOverride<{
      ttl: number;
      limit: number;
    }>(THROTTLE_KEY, [context.getHandler(), context.getClass()]);

    let throttleLimit: ThrottleLimit;
    if (throttleConfig) {
      throttleLimit = ThrottleLimit.create(throttleConfig.ttl, throttleConfig.limit);
    } else {
      const ttl = this.configService.get<number>('throttler.ttl');
      const limit = this.configService.get<number>('throttler.limit');
      throttleLimit = ThrottleLimit.create(ttl, limit);
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Check if user agent should be ignored
    const ignoreUserAgents = this.configService.get<string[]>('throttler.ignoreUserAgents');
    const userAgent = request.headers['user-agent'] || '';

    if (ignoreUserAgents && ignoreUserAgents.some((agent) => userAgent.includes(agent))) {
      return true;
    }

    // Use IP as the identifier for throttling (or user ID if authenticated)
    // Can be extended to use different strategies based on requirements
    const identifier = this.getIdentifier(request);

    // Track this request for rate limiting - this will throw ThrottlingException if over limit
    await this.throttlerService.trackRequest(identifier, throttleLimit);

    // Add rate limit headers to the response
    const remaining = await this.throttlerService.getRemainingRequests(identifier, throttleLimit);

    const response = context.switchToHttp().getResponse();
    response.header('X-RateLimit-Limit', throttleLimit.getLimit.toString());
    response.header('X-RateLimit-Remaining', remaining.toString());
    response.header('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + throttleLimit.getTtl).toString());

    return true;
  }

  private getIdentifier(request: Request): string {
    // If a user is authenticated, use user ID
    if (request.user && 'id' in request.user) {
      return `user:${request.user['id']}`;
    }

    // Otherwise use IP address
    return `ip:${request.ip}`;
  }
}
