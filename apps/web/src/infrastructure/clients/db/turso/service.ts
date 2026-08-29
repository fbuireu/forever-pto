import { DatabaseError } from "@infrastructure/errors";
import { type Connection, connect } from "@tursodatabase/serverless";
import type { InValue } from "@tursodatabase/serverless/compat";
import { Context, Effect, Layer } from "effect";

export class TursoService extends Context.Tag("TursoService")<
	TursoService,
	{
		query<T = unknown>(sql: string, args?: InValue[]): Effect.Effect<T[], DatabaseError>;
		execute(sql: string, args?: InValue[]): Effect.Effect<number, DatabaseError>;
	}
>() {}

export const TursoServiceLive = Layer.sync(TursoService, () => {
	const createConnection = () => {
		const url = process.env.TURSO_DATABASE_URL;
		const authToken = process.env.TURSO_AUTH_TOKEN;

		if (!url || !authToken) {
			throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be defined");
		}

		return connect({ url, authToken });
	};

	const withConnection = async <T>(use: (connection: Connection) => Promise<T>): Promise<T> => {
		const connection = createConnection();

		try {
			return await use(connection);
		} finally {
			await connection.close();
		}
	};

	const wrapError = (error: unknown): DatabaseError =>
		new DatabaseError({
			message: error instanceof Error ? error.message : String(error),
			cause: error,
		});

	return {
		query: <T = unknown>(sql: string, args?: InValue[]): Effect.Effect<T[], DatabaseError> =>
			Effect.tryPromise({
				try: () => withConnection(async (connection) => (await connection.all(sql, args ?? [])) as T[]),
				catch: wrapError,
			}),

		execute: (sql: string, args?: InValue[]): Effect.Effect<number, DatabaseError> =>
			Effect.tryPromise({
				try: () =>
					withConnection(async (connection) => {
						const { changes } = await connection.run(sql, args ?? []);
						return Number(changes ?? 0);
					}),
				catch: wrapError,
			}),
	};
});
