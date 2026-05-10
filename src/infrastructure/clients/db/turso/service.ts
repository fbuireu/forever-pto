import { DatabaseError } from '@infrastructure/errors';
import { connect } from '@tursodatabase/serverless';
import type { InValue } from '@tursodatabase/serverless/compat';
import { Context, Effect, Layer } from 'effect';

export class TursoService extends Context.Tag('TursoService')<
  TursoService,
  {
    query<T = unknown>(sql: string, args?: InValue[]): Effect.Effect<T[], DatabaseError>;
    execute(sql: string, args?: InValue[]): Effect.Effect<void, DatabaseError>;
    batch(statements: Array<{ sql: string; args?: InValue[] }>): Effect.Effect<void, DatabaseError>;
  }
>() {}

export const TursoServiceLive = Layer.sync(TursoService, () => {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be defined');
  }

  const createConnection = () => connect({ url, authToken });

  const wrapError = (error: unknown): DatabaseError =>
    new DatabaseError({
      message: error instanceof Error ? error.message : String(error),
      cause: error,
    });

  return {
    query: <T = unknown>(sql: string, args?: InValue[]): Effect.Effect<T[], DatabaseError> =>
      Effect.tryPromise({
        try: async () => {
          const conn = createConnection();
          const stmt = await conn.prepare(sql);
          const rows = await stmt.all(args ?? []);
          return rows as T[];
        },
        catch: wrapError,
      }),

    execute: (sql: string, args?: InValue[]): Effect.Effect<void, DatabaseError> =>
      Effect.tryPromise({
        try: async () => {
          const conn = createConnection();
          const stmt = await conn.prepare(sql);
          await stmt.run(args ?? []);
        },
        catch: wrapError,
      }),

    batch: (statements: Array<{ sql: string; args?: InValue[] }>): Effect.Effect<void, DatabaseError> =>
      Effect.tryPromise({
        try: async () => {
          const conn = createConnection();
          await conn.batch(statements.map((s) => s.sql));
        },
        catch: wrapError,
      }),
  };
});
