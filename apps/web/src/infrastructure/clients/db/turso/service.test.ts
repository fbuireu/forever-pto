import { DatabaseError } from "@infrastructure/errors";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAll, mockRun, mockClose, mockPrepare, mockConnect } = vi.hoisted(() => {
	const mockAll = vi.fn();
	const mockRun = vi.fn();
	const mockClose = vi.fn().mockResolvedValue(undefined);
	const mockPrepare = vi.fn();
	const mockConnect = vi.fn().mockReturnValue({ all: mockAll, run: mockRun, close: mockClose, prepare: mockPrepare });
	return { mockAll, mockRun, mockClose, mockPrepare, mockConnect };
});

vi.mock("@tursodatabase/serverless", () => ({
	connect: mockConnect,
}));

const { TursoService, TursoServiceLive } = await import("./service");

beforeEach(() => {
	vi.clearAllMocks();
	mockClose.mockResolvedValue(undefined);
	process.env.TURSO_DATABASE_URL = "libsql://test.turso.io";
	process.env.TURSO_AUTH_TOKEN = "test-token";
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("TursoServiceLive initialisation", () => {
	it("builds the layer even when TURSO_DATABASE_URL is missing", () => {
		vi.stubEnv("TURSO_DATABASE_URL", "");
		expect(() => Effect.runSync(Effect.provide(TursoService, TursoServiceLive))).not.toThrow();
	});

	it("fails as DatabaseError when TURSO_DATABASE_URL is missing", async () => {
		vi.stubEnv("TURSO_DATABASE_URL", "");
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.query("SELECT 1").pipe(Effect.flip);
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(error).toBeInstanceOf(DatabaseError);
		expect(error.message).toContain("TURSO_DATABASE_URL");
		expect(mockConnect).not.toHaveBeenCalled();
	});

	it("fails as DatabaseError when TURSO_AUTH_TOKEN is missing", async () => {
		vi.stubEnv("TURSO_AUTH_TOKEN", "");
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.execute("DELETE FROM test").pipe(Effect.flip);
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(error).toBeInstanceOf(DatabaseError);
		expect(error.message).toContain("TURSO_AUTH_TOKEN");
	});
});

describe("TursoService.query", () => {
	it("returns the rows the connection answered", async () => {
		mockAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
		const rows = await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.query("SELECT * FROM test");
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(rows).toEqual([{ id: 1 }, { id: 2 }]);
		expect(mockAll).toHaveBeenCalledWith("SELECT * FROM test", []);
	});

	it("passes args to the connection", async () => {
		mockAll.mockResolvedValue([]);
		await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.query("SELECT * FROM test WHERE id = ?", [42]);
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(mockAll).toHaveBeenCalledWith("SELECT * FROM test WHERE id = ?", [42]);
	});

	it("never prepares, so the describe round trip is not paid for", async () => {
		mockAll.mockResolvedValue([]);
		await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.query("SELECT 1");
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(mockPrepare).not.toHaveBeenCalled();
	});

	it("wraps thrown errors as DatabaseError", async () => {
		mockAll.mockRejectedValue(new Error("connection refused"));
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.query("SELECT 1").pipe(Effect.flip);
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(error).toBeInstanceOf(DatabaseError);
	});
});

describe("TursoService.execute", () => {
	it("answers with the number of rows the statement touched", async () => {
		mockRun.mockResolvedValue({ changes: 1, lastInsertRowid: 7 });
		await expect(
			Effect.runPromise(
				Effect.gen(function* () {
					const turso = yield* TursoService;
					return yield* turso.execute("DELETE FROM test WHERE id = ?", [1]);
				}).pipe(Effect.provide(TursoServiceLive)),
			),
		).resolves.toBe(1);
		expect(mockRun).toHaveBeenCalledWith("DELETE FROM test WHERE id = ?", [1]);
	});

	it("answers 0 when the statement touched nothing", async () => {
		mockRun.mockResolvedValue({ changes: 0, lastInsertRowid: 0 });
		await expect(
			Effect.runPromise(
				Effect.gen(function* () {
					const turso = yield* TursoService;
					return yield* turso.execute("UPDATE test SET a = 1 WHERE id = ?", [1]);
				}).pipe(Effect.provide(TursoServiceLive)),
			),
		).resolves.toBe(0);
	});

	it("never prepares, so the describe round trip is not paid for", async () => {
		mockRun.mockResolvedValue({ changes: 0, lastInsertRowid: 0 });
		await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.execute("DELETE FROM test");
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(mockPrepare).not.toHaveBeenCalled();
	});

	it("wraps thrown errors as DatabaseError", async () => {
		mockRun.mockRejectedValue(new Error("disk full"));
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.execute("INSERT INTO test VALUES (?)").pipe(Effect.flip);
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(error).toBeInstanceOf(DatabaseError);
	});
});

describe("the server-side stream is always released", () => {
	it("closes the connection a query opened", async () => {
		mockAll.mockResolvedValue([]);
		await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.query("SELECT 1");
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(mockClose).toHaveBeenCalledOnce();
	});

	it("closes the connection an execute opened", async () => {
		mockRun.mockResolvedValue({ changes: 1, lastInsertRowid: 1 });
		await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.execute("DELETE FROM test");
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(mockClose).toHaveBeenCalledOnce();
	});

	it("closes the connection when the query fails", async () => {
		mockAll.mockRejectedValue(new Error("connection refused"));
		await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.query("SELECT 1").pipe(Effect.flip);
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(mockClose).toHaveBeenCalledOnce();
	});

	it("closes the connection when the execute fails", async () => {
		mockRun.mockRejectedValue(new Error("disk full"));
		await Effect.runPromise(
			Effect.gen(function* () {
				const turso = yield* TursoService;
				return yield* turso.execute("DELETE FROM test").pipe(Effect.flip);
			}).pipe(Effect.provide(TursoServiceLive)),
		);
		expect(mockClose).toHaveBeenCalledOnce();
	});
});
