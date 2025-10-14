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
      ...baseContext,
    };
  }

  private getLogger(context?: LogContext) {
    const fullContext = { ...this.baseContext, ...context };
    return Object.keys(fullContext).length > 0 ? log.with(fullContext) : log;
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
    this.getLogger({
      ...context,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }).error(message);
  }

  withContext(context: LogContext): BetterStackClient {
    return new BetterStackClient({ ...this.baseContext, ...context });
  }
}

let instance: BetterStackClient | null = null;

export const getBetterStackClient = (): BetterStackClient => {
  instance ??= new BetterStackClient();
  return instance;
};
