import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { DatabaseError } from "@infrastructure/errors";
import { Effect, Layer } from "effect";
import { type StatementParams, TursoService } from "./service";

type TursoArgs = NonNullable<StatementParams["args"]>;

export interface FixtureTurso {
	layer: Layer.Layer<TursoService>;
	database: DatabaseSync;
}

const bindable = (value: TursoArgs[number]): SQLInputValue => {
	if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "bigint")
		return value;

	throw new TypeError(`The Turso fixture binds no ${typeof value}`);
};

const onALaterTask = <T>(statement: () => T): Effect.Effect<T, DatabaseError> =>
	Effect.tryPromise({
		try: () => new Promise<void>((resolve) => setTimeout(resolve, 0)).then(statement),
		catch: (error) =>
			new DatabaseError({ message: error instanceof Error ? error.message : String(error), cause: error }),
	});

export const createFixtureTurso = (schema: string): FixtureTurso => {
	const database = new DatabaseSync(":memory:");
	database.exec(schema);

	return {
		database,
		layer: Layer.succeed(TursoService, {
			query: <T = unknown>({ sql, args = [] }: StatementParams) =>
				onALaterTask(() => database.prepare(sql).all(...args.map(bindable)) as T[]),
			execute: ({ sql, args = [] }: StatementParams) =>
				onALaterTask(() => Number(database.prepare(sql).run(...args.map(bindable)).changes)),
		}),
	};
};
