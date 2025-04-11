import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '@infrastructure/logger/logger.service';

interface IHttpExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(LoggerService) private readonly logger: LoggerService) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: Error | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const typedResponse = exceptionResponse as IHttpExceptionResponse;
        message = typedResponse.message || exception.message;
        error = typedResponse.error || 'Error';
      } else {
        message = (exceptionResponse as string) || exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error with structured data
    this.logger.error(
      {
        message: 'Request error',
        method: request.method,
        url: request.url,
        status,
        error,
        errorMessage: message,
        userId: (request.user && request.user['sub']) || 'anonymous',
      },
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
