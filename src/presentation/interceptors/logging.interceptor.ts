import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '@infrastructure/logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, user } = req;
    const userId = user?.sub || 'anonymous';

    // Log the request
    this.logger.log({
      message: `Request received`,
      userId,
      method,
      url,
      body,
    });

    const now = Date.now();

    return next.handle().pipe(
      tap(data => {
        // Log the response
        this.logger.log({
          message: `Request completed`,
          userId,
          method,
          url,
          processingTime: `${Date.now() - now}ms`,
          responseType: typeof data === 'object' ? 'Object' : typeof data,
        });
      }),
    );
  }
}
