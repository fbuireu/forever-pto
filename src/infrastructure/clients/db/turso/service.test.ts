import { DatabaseError } from '@infrastructure/errors';
import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAll, mockRun, mockBatch, mockPrepare, mockConnect } = vi.hoisted(() => {
  const mockAll = vi.fn();
  const mockRun = vi.fn();
  const mockBatch = vi.fn();
  const mockPrepare = vi.fn().mockImplementation(() => ({ all: mockAll, run: mockRun }));
  const mockConnect = vi.fn().mockReturnValue({ prepare: mockPrepare, batch: mockBatch });
  return { mockAll, mockRun, mockBatch, mockPrepare, mockConnect };
});

vi.mock('@tursodatabase/serverless', () => ({
  connect: mockConnect,
}));

const { TursoService, TursoServiceLive } = await import('./service');

beforeEach(() => {
  vi.clearAllMocks();
  process.env.TURSO_DATABASE_URL = 'libsql://test.turso.io';
  process.env.TURSO_AUTH_TOKEN = 'test-token';
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('TursoServiceLive initialisation', () => {
  it('throws when TURSO_DATABASE_URL is missing', () => {
    vi.stubEnv('TURSO_DATABASE_URL', '');
    expect(() => Effect.runSync(Effect.provide(TursoService, TursoServiceLive))).toThrow('TURSO_DATABASE_URL');
  });

  it('throws when TURSO_AUTH_TOKEN is missing', () => {
    vi.stubEnv('TURSO_AUTH_TOKEN', '');
    expect(() => Effect.runSync(Effect.provide(TursoService, TursoServiceLive))).toThrow('TURSO_AUTH_TOKEN');
  });
});

describe('TursoService.query', () => {
  it('returns rows from the prepared statement', async () => {
    mockAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const rows = await Effect.runPromise(
      Effect.gen(function* () {
        const turso = yield* TursoService;
        return yield* turso.query('SELECT * FROM test');
      }).pipe(Effect.provide(TursoServiceLive))
    );
    expect(rows).toEqual([{ id: 1 }, { id: 2 }]);
    expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM test');
    expect(mockAll).toHaveBeenCalledWith([]);
  });

  it('passes args to the prepared statement', async () => {
    mockAll.mockResolvedValue([]);
    await Effect.runPromise(
      Effect.gen(function* () {
        const turso = yield* TursoService;
        return yield* turso.query('SELECT * FROM test WHERE id = ?', [42]);
      }).pipe(Effect.provide(TursoServiceLive))
    );
    expect(mockAll).toHaveBeenCalledWith([42]);
  });

  it('wraps thrown errors as DatabaseError', async () => {
    mockAll.mockRejectedValue(new Error('connection refused'));
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const turso = yield* TursoService;
        return yield* turso.query('SELECT 1').pipe(Effect.flip);
      }).pipe(Effect.provide(TursoServiceLive))
    );
    expect(error).toBeInstanceOf(DatabaseError);
  });
});

describe('TursoService.execute', () => {
  it('runs the statement successfully', async () => {
    mockRun.mockResolvedValue(undefined);
    await expect(
      Effect.runPromise(
        Effect.gen(function* () {
          const turso = yield* TursoService;
          yield* turso.execute('DELETE FROM test WHERE id = ?', [1]);
        }).pipe(Effect.provide(TursoServiceLive))
      )
    ).resolves.toBeUndefined();
    expect(mockRun).toHaveBeenCalledWith([1]);
  });

  it('wraps thrown errors as DatabaseError', async () => {
    mockRun.mockRejectedValue(new Error('disk full'));
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const turso = yield* TursoService;
        return yield* turso.execute('INSERT INTO test VALUES (?)').pipe(Effect.flip);
      }).pipe(Effect.provide(TursoServiceLive))
    );
    expect(error).toBeInstanceOf(DatabaseError);
  });
});

describe('TursoService.batch', () => {
  it('executes all statements', async () => {
    mockBatch.mockResolvedValue(undefined);
    await Effect.runPromise(
      Effect.gen(function* () {
        const turso = yield* TursoService;
        yield* turso.batch([{ sql: 'INSERT INTO a VALUES (1)' }, { sql: 'INSERT INTO b VALUES (2)' }]);
      }).pipe(Effect.provide(TursoServiceLive))
    );
    expect(mockBatch).toHaveBeenCalledWith(['INSERT INTO a VALUES (1)', 'INSERT INTO b VALUES (2)']);
  });

  it('wraps thrown errors as DatabaseError', async () => {
    mockBatch.mockRejectedValue(new Error('batch failed'));
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const turso = yield* TursoService;
        return yield* turso.batch([{ sql: 'INSERT INTO a VALUES (1)' }]).pipe(Effect.flip);
      }).pipe(Effect.provide(TursoServiceLive))
    );
    expect(error).toBeInstanceOf(DatabaseError);
  });
});
