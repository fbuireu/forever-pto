import { TursoService } from "@infrastructure/clients/db/turso/service";
import { DatabaseError } from "@infrastructure/errors";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findContactWithMessage, findLatestContactSince, saveContact } = await import("./repository");

const mockExecute = vi.fn();

const MockTursoLayer = Layer.succeed(TursoService, {
	execute: mockExecute,
	query: vi.fn(),
});

const CONTACT_DATA = {
	email: "user@example.com",
	name: "Test User",
	subject: "Hello",
	message: "Test message",
	messageId: null,
	origin: null,
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
	mockExecute.mockReturnValue(Effect.succeed(undefined));
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("saveContact", () => {
	it("executes an INSERT with the generated UUID and contact data", async () => {
		await Effect.runPromise(saveContact(CONTACT_DATA).pipe(Effect.provide(MockTursoLayer)));

		expect(mockExecute).toHaveBeenCalledOnce();
		const [sql, args] = mockExecute.mock.calls[0] as [string, unknown[]];
		expect(sql).toContain("INSERT INTO contacts");
		expect(args[0]).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
		expect(args[1]).toBe(CONTACT_DATA.email);
		expect(args[2]).toBe(CONTACT_DATA.name);
		expect(args[3]).toBe(CONTACT_DATA.subject);
		expect(args[4]).toBe(CONTACT_DATA.message);
	});

	it("passes null for messageId and origin when they are null", async () => {
		await Effect.runPromise(saveContact(CONTACT_DATA).pipe(Effect.provide(MockTursoLayer)));

		const [, args] = mockExecute.mock.calls[0] as [string, unknown[]];
		expect(args[5]).toBeNull();
		expect(args[6]).toBeNull();
	});

	it("passes messageId and origin when provided", async () => {
		const data = { ...CONTACT_DATA, messageId: "msg-123", origin: process.env.NEXT_PUBLIC_SITE_URL };
		await Effect.runPromise(saveContact(data).pipe(Effect.provide(MockTursoLayer)));

		const [, args] = mockExecute.mock.calls[0] as [string, unknown[]];
		expect(args[5]).toBe("msg-123");
		expect(args[6]).toBe(process.env.NEXT_PUBLIC_SITE_URL);
	});

	it("propagates DatabaseError when execute fails", async () => {
		const dbError = new DatabaseError({ message: "connection refused", cause: new Error("test-error") });
		mockExecute.mockReturnValue(Effect.fail(dbError));

		const error = await Effect.runPromise(saveContact(CONTACT_DATA).pipe(Effect.provide(MockTursoLayer), Effect.flip));

		expect(error).toBeInstanceOf(DatabaseError);
		expect(error.message).toBe("connection refused");
	});
});

const mockQuery = vi.fn();

const MockQueryLayer = Layer.succeed(TursoService, {
	execute: vi.fn(),
	query: mockQuery,
});

const runQuery = <A>(effect: Effect.Effect<A, DatabaseError, TursoService>) =>
	Effect.runPromise(effect.pipe(Effect.provide(MockQueryLayer)));

const sqlOf = () => (mockQuery.mock.calls[0] as [string, unknown[]])[0];

const argsOf = () => (mockQuery.mock.calls[0] as [string, unknown[]])[1];

describe("findLatestContactSince", () => {
	beforeEach(() => {
		mockQuery.mockReturnValue(Effect.succeed([]));
	});

	it("answers true when a row already exists in the window", async () => {
		mockQuery.mockReturnValue(Effect.succeed([{ id: "existing" }]));

		await expect(
			runQuery(findLatestContactSince({ senderKey: "user@example.com", since: "2026-08-30T00:00:00Z" })),
		).resolves.toBe(true);
	});

	it("answers false when nothing has been sent in the window", async () => {
		await expect(
			runQuery(findLatestContactSince({ senderKey: "user@example.com", since: "2026-08-30T00:00:00Z" })),
		).resolves.toBe(false);
	});

	it("asks for one row only, since the answer is a yes or a no", async () => {
		await runQuery(findLatestContactSince({ senderKey: "user@example.com", since: "2026-08-30T00:00:00Z" }));

		expect(sqlOf()).toContain("LIMIT 1");
		expect(argsOf()).toEqual(["user@example.com", "2026-08-30T00:00:00Z"]);
	});

	it("compares on the normalised sender, so a plus tag cannot buy a second submission", async () => {
		await runQuery(findLatestContactSince({ senderKey: "user@example.com", since: "2026-08-30T00:00:00Z" }));

		const sql = sqlOf();

		expect(sql).toContain("lower(trim(email))");
		expect(sql).toContain("'+'");
		expect(sql).toContain("'@'");
	});

	it("propagates a DatabaseError rather than reading it as no match", async () => {
		mockQuery.mockReturnValue(Effect.fail(new DatabaseError({ message: "connection refused", cause: null })));

		const error = await Effect.runPromise(
			findLatestContactSince({ senderKey: "user@example.com", since: "2026-08-30T00:00:00Z" }).pipe(
				Effect.provide(MockQueryLayer),
				Effect.flip,
			),
		);

		expect(error).toBeInstanceOf(DatabaseError);
	});
});

describe("findContactWithMessage", () => {
	beforeEach(() => {
		mockQuery.mockReturnValue(Effect.succeed([]));
	});

	it("answers true when the same sender already sent that message", async () => {
		mockQuery.mockReturnValue(Effect.succeed([{ id: "existing" }]));

		await expect(runQuery(findContactWithMessage({ senderKey: "user@example.com", message: "Hello" }))).resolves.toBe(
			true,
		);
	});

	it("answers false for a message nobody has sent", async () => {
		await expect(runQuery(findContactWithMessage({ senderKey: "user@example.com", message: "Hello" }))).resolves.toBe(
			false,
		);
	});

	it("matches on the message and the normalised sender together", async () => {
		await runQuery(findContactWithMessage({ senderKey: "user@example.com", message: "Hello" }));

		expect(sqlOf()).toContain("message = ?");
		expect(sqlOf()).toContain("lower(trim(email))");
		expect(argsOf()).toEqual(["user@example.com", "Hello"]);
	});

	it("propagates a DatabaseError rather than reading it as no match", async () => {
		mockQuery.mockReturnValue(Effect.fail(new DatabaseError({ message: "connection refused", cause: null })));

		const error = await Effect.runPromise(
			findContactWithMessage({ senderKey: "user@example.com", message: "Hello" }).pipe(
				Effect.provide(MockQueryLayer),
				Effect.flip,
			),
		);

		expect(error).toBeInstanceOf(DatabaseError);
	});
});
