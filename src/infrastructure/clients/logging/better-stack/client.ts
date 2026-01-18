import { Logtail } from '@logtail/edge';

export interface LogContext {
  [key: string]: unknown;
}

const sourceToken = process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN;
const ingestingUrl = process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_URL;

const logtail = sourceToken && ingestingUrl ? new Logtail(sourceToken, { endpoint: ingestingUrl }) : null;

export class BetterStackClient {
  private readonly baseContext: LogContext;

  constructor(baseContext?: LogContext) {
    this.baseContext = {
      environment: process.env.NODE_ENV || 'development',
      service: 'forever-pto',
      ...baseContext,
    };
  }

  private getFullContext(context?: LogContext): LogContext {
    return {
      ...this.baseContext,
      ...context,
    };
  }

  debug(message: string, context?: LogContext): void {
    if (!logtail) return;
    void logtail.debug(message, this.getFullContext(context));
  }

  info(message: string, context?: LogContext): void {
    if (!logtail) return;
    void logtail.info(message, this.getFullContext(context));
  }

  warn(message: string, context?: LogContext): void {
    if (!logtail) return;
    void logtail.warn(message, this.getFullContext(context));
  }

  error(message: string, context?: LogContext): void {
    if (!logtail) return;
    void logtail.error(message, this.getFullContext(context));
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

    this.error(message, errorContext);
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

  async flush(): Promise<void> {
    if (logtail) {
      await logtail.flush();
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
