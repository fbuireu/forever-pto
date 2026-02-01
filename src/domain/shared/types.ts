export type LogContext = {
  [key: string]: unknown;
};

export type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  logError: (message: string, error: unknown, context?: LogContext) => void;
  logDuration: (operation: string, durationMs: number, context?: LogContext) => void;
  measureAsync: <T>(operation: string, fn: () => Promise<T>, context?: LogContext) => Promise<T>;
  withContext: (context: LogContext) => Logger;
};
