import { log } from '@logtail/next';

export interface LogContext {
  [key: string]: unknown;
}

export class BetterStackClient {
  private readonly baseContext: LogContext;

  constructor(baseContext?: LogContext) {
    this.baseContext = {
      environment: process.env.NODE_ENV || 'development',
      service: 'forever-pto',
      timestamp: new Date().toISOString(),
      ...baseContext,
    };
  }

  private getLogger(context?: LogContext) {
    const processedContext = this.processContext(context);
    const fullContext = {
      ...this.baseContext,
      ...processedContext,
      timestamp: new Date().toISOString(),
    };
    return Object.keys(fullContext).length > 0 ? log.with(fullContext) : log;
  }

  private processContext(context?: LogContext): LogContext {
    if (!context) return {};
    return context;
  }

  debug(message: string, context?: LogContext): void {
    this.getLogger(context).debug(message);
  }

  info(message: string, context?: LogContext): void {
    this.getLogger(context).info(message);
  }

  warn(message: string, context?: LogContext): void {
    this.getLogger(context).warn(message);
  }

  error(message: string, context?: LogContext): void {
    this.getLogger(context).error(message);
  }

  logError(message: string, error: unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      error: {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
        ...(error instanceof Error && Object.keys(error).length > 0
          ? Object.fromEntries(Object.entries(error).filter(([key]) => !['message', 'name', 'stack'].includes(key)))
          : {}),
      },
    };

    this.getLogger(errorContext).error(message);
  }

  logDuration(operation: string, durationMs: number, context?: LogContext): void {
    this.info(`${operation} completed`, {
      ...context,
      duration_ms: durationMs,
      duration_seconds: durationMs / 1000,
    });
  }

  async measureAsync<T>(operation: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.logDuration(operation, duration, { ...context, status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(`${operation} failed`, error, {
        ...context,
        duration_ms: duration,
        status: 'error',
      });
      throw error;
    }
  }

  withContext(context: LogContext): BetterStackClient {
    return new BetterStackClient({ ...this.baseContext, ...context });
  }
}

let instance: BetterStackClient | null = null;

export const getBetterStackInstance = (): BetterStackClient => {
  instance ??= new BetterStackClient();
  return instance;
};
