import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { ValidationError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { zodParse } from './zodParse';

const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const TestLayer = Layer.succeed(LoggerService, mockLogger);
const run = <A>(eff: Effect.Effect<A, ValidationError, LoggerService>) =>
  Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));
const runFail = <A>(eff: Effect.Effect<A, ValidationError, LoggerService>) =>
  Effect.runPromise(Effect.flip(eff).pipe(Effect.provide(TestLayer)));

const schema = z.object({ name: z.string().min(2), age: z.number() });

beforeEach(() => vi.clearAllMocks());

describe('zodParse', () => {
  it('resolves with the parsed value for valid data', async () => {
    const result = await run(zodParse(schema, { name: 'Alice', age: 30 }));
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('rejects with ValidationError for a Zod violation', async () => {
    const err = await runFail(zodParse(schema, { name: 'A', age: 30 }));
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('logs the failing field and message on ZodError', async () => {
    await runFail(zodParse(schema, { name: 'A', age: 30 }));
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Validation error',
      expect.objectContaining({ field: 'name', message: expect.any(String) })
    );
  });

  it('carries the Zod message in the ValidationError', async () => {
    const err = await runFail(zodParse(schema, { name: 'A', age: 30 }));
    expect(err.message).toBeTruthy();
  });

  it('rejects with ValidationError for non-Zod errors', async () => {
    const badSchema = {
      parse: () => {
        throw new Error('unexpected');
      },
    } as unknown as z.ZodType<string>;
    const err = await runFail(zodParse(badSchema, 'data'));
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('calls logError (not warn) for non-Zod errors', async () => {
    const badSchema = {
      parse: () => {
        throw new Error('unexpected');
      },
    } as unknown as z.ZodType<string>;
    await runFail(zodParse(badSchema, 'data'));
    expect(mockLogger.logError).toHaveBeenCalledOnce();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });
});
