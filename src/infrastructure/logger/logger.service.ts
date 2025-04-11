import {
  Inject,
  Injectable,
  LoggerService as NestLoggerService,
  LogLevel,
  Scope,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private static logLevels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const env = this.configService.get<string>('NODE_ENV', 'development');
    LoggerService.logLevels = this.getLogLevels(env);
  }

  setContext(context: string): this {
    this.context = context;

    return this;
  }

  log(message: unknown, context?: string): void {
    if (this.isLevelEnabled('log')) {
      this.printMessage(message, 'log', context || this.context);
    }
  }

  error(message: unknown, stack?: string, context?: string): void {
    if (this.isLevelEnabled('error')) {
      this.printMessage(message, 'error', context || this.context, stack);
    }
  }

  warn(message: unknown, context?: string): void {
    if (this.isLevelEnabled('warn')) {
      this.printMessage(message, 'warn', context || this.context);
    }
  }

  debug(message: unknown, context?: string): void {
    if (this.isLevelEnabled('debug')) {
      this.printMessage(message, 'debug', context || this.context);
    }
  }

  verbose(message: unknown, context?: string): void {
    if (this.isLevelEnabled('verbose')) {
      this.printMessage(message, 'verbose', context || this.context);
    }
  }

  private printMessage(message: unknown, level: LogLevel, context?: string, stack?: string): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = this.formatMessage(message);
    const contextStr = context ? `[${context}]` : '';

    const logEntry = {
      timestamp,
      level,
      message: formattedMessage,
      context: context || 'Application',
    };

    if (stack) {
      Object.assign(logEntry, { stack });
    }

    if (level === 'error') {
      console.error(
        `${timestamp} ${level.toUpperCase()} ${contextStr}:`,
        formattedMessage,
        stack || '',
      );
    } else if (level === 'warn') {
      console.warn(`${timestamp} ${level.toUpperCase()} ${contextStr}:`, formattedMessage);
    } else {
      // For debug, verbose, and log levels in production, we use console.warn
      // to comply with linting rules that only allow console.warn and console.error
      console.warn(`${timestamp} ${level.toUpperCase()} ${contextStr}:`, formattedMessage);
    }
  }

  private formatMessage(message: unknown): string {
    if (typeof message === 'object') {
      return JSON.stringify(message, null, 2);
    }

    return String(message);
  }

  private isLevelEnabled(level: LogLevel): boolean {
    return LoggerService.logLevels.includes(level);
  }

  private getLogLevels(environment: string): LogLevel[] {
    if (environment === 'production') {
      return ['error', 'warn', 'log'];
    }

    return ['error', 'warn', 'log', 'debug', 'verbose'];
  }
}
