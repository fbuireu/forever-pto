import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { Context, Layer } from 'effect';

export class LoggerService extends Context.Tag('LoggerService')<
  LoggerService,
  {
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>): void;
    logError(message: string, error: unknown, context?: Record<string, unknown>): void;
  }
>() {}

export const LoggerServiceLive = Layer.sync(LoggerService, () => getBetterStackInstance());
