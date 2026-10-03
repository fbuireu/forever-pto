import { contactCooldownStart } from "@application/dto/contact/rules";
import type { ContactData } from "@application/dto/contact/types";
import type { TursoService } from "@infrastructure/clients/db/turso/service";
import { DatabaseError } from "@infrastructure/errors";
import { Effect } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import { createContactsFixture } from "./fixture";
import { findContactWithMessage, recordContactMessageId, releaseContactSlot, reserveContactSlot } from "./repository";

let contacts = createContactsFixture();

beforeEach(() => {
	contacts = createContactsFixture();
});

const run = <A>(effect: Effect.Effect<A, DatabaseError, TursoService>) =>
	Effect.runPromise(effect.pipe(Effect.provide(contacts.layer)));

const runFail = <A>(effect: Effect.Effect<A, DatabaseError, TursoService>) =>
	Effect.runPromise(Effect.flip(effect).pipe(Effect.provide(contacts.layer)));

const SINCE = contactCooldownStart({ now: new Date("2026-10-02T13:40:00Z") });
const SENDER_KEY = "user@example.com";

const CONTACT: ContactData = {
	email: "user@example.com",
	name: "Test User",
	subject: "Hello",
	message: "Test message",
	messageId: null,
	origin: null,
};

interface SeedParams {
	email: string;
	message: string;
	createdDate: string;
}

const seed = ({ email, message, createdDate }: SeedParams) =>
	contacts.database
		.prepare(
			`INSERT INTO contacts (id, email, name, subject, message, message_id, origin, created_date, updated_at)
       VALUES (?, ?, 'Earlier', 'Earlier', ?, NULL, NULL, ?, ?)`,
		)
		.run(crypto.randomUUID(), email, message, createdDate, createdDate);

const reserve = (contact: ContactData = CONTACT) =>
	reserveContactSlot({ senderKey: SENDER_KEY, since: SINCE, contact });

const storedRows = () => contacts.database.prepare("SELECT id, email, message, message_id FROM contacts").all();

describe("reserveContactSlot over a real SQLite", () => {
	it("takes the slot when the sender has never written, and answers the new row's id", async () => {
		const id = await run(reserve());

		expect(storedRows()).toEqual([{ id, email: CONTACT.email, message: CONTACT.message, message_id: null }]);
	});

	it("refuses inside the window and writes nothing", async () => {
		seed({ email: CONTACT.email, message: "An earlier message", createdDate: "2026-10-02 12:00:00" });

		await expect(run(reserve())).resolves.toBeNull();
		expect(storedRows()).toHaveLength(1);
	});

	it("holds the window across midnight UTC, comparing the stored time and the window's start as instants", async () => {
		seed({ email: CONTACT.email, message: "An earlier message", createdDate: "2026-10-01 20:00:00" });

		await expect(run(reserve())).resolves.toBeNull();
	});

	it("counts the window's first second inside it", async () => {
		seed({ email: CONTACT.email, message: "An earlier message", createdDate: "2026-10-01 13:40:00" });

		await expect(run(reserve())).resolves.toBeNull();
	});

	it("takes the slot once the sender's last message is older than the window", async () => {
		seed({ email: CONTACT.email, message: "An earlier message", createdDate: "2026-10-01 13:39:59" });

		await expect(run(reserve())).resolves.toEqual(expect.any(String));
		expect(storedRows()).toHaveLength(2);
	});

	it("refuses the same message at any age", async () => {
		seed({ email: CONTACT.email, message: CONTACT.message, createdDate: "2025-01-01 00:00:00" });

		await expect(run(reserve())).resolves.toBeNull();
	});

	it("keys on the sender with the case, the spaces and a plus-alias stripped", async () => {
		seed({ email: "  User+news@Example.com ", message: "An earlier message", createdDate: "2026-10-02 12:00:00" });

		await expect(run(reserve())).resolves.toBeNull();
	});

	it("leaves another sender's slot alone", async () => {
		seed({ email: "other@example.com", message: CONTACT.message, createdDate: "2026-10-02 12:00:00" });

		await expect(run(reserve())).resolves.toEqual(expect.any(String));
	});

	it("gives one of two reservations made at the same moment the slot, and the other nothing", async () => {
		const ids = await run(
			Effect.all([reserve(), reserve({ ...CONTACT, message: "A second message" })], { concurrency: "unbounded" }),
		);

		expect(ids.filter((id) => id === null)).toHaveLength(1);
		expect(storedRows()).toHaveLength(1);
	});

	it("propagates a DatabaseError rather than reading it as a refusal", async () => {
		contacts.database.exec("DROP TABLE contacts");

		expect(await runFail(reserve())).toBeInstanceOf(DatabaseError);
	});
});

describe("releaseContactSlot", () => {
	it("deletes the reserved row and no other", async () => {
		seed({ email: "other@example.com", message: "Someone else's message", createdDate: "2026-10-02 12:00:00" });
		const id = await run(reserve());
		if (id === null) throw new Error("the slot was free");

		await run(releaseContactSlot(id));

		expect(storedRows()).toEqual([
			{ id: expect.any(String), email: "other@example.com", message: "Someone else's message", message_id: null },
		]);
	});
});

describe("recordContactMessageId", () => {
	it("records the message id on the reserved row only", async () => {
		seed({ email: "other@example.com", message: "Someone else's message", createdDate: "2026-10-02 12:00:00" });
		const id = await run(reserve());
		if (id === null) throw new Error("the slot was free");

		await run(recordContactMessageId({ id, messageId: "msg-123" }));

		expect(storedRows()).toEqual([
			{ id: expect.any(String), email: "other@example.com", message: "Someone else's message", message_id: null },
			{ id, email: CONTACT.email, message: CONTACT.message, message_id: "msg-123" },
		]);
	});
});

describe("findContactWithMessage over a real SQLite", () => {
	it("answers true when the same sender already sent that message, under any alias", async () => {
		seed({ email: "User+news@example.com", message: "Hello", createdDate: "2025-01-01 00:00:00" });

		await expect(run(findContactWithMessage({ senderKey: SENDER_KEY, message: "Hello" }))).resolves.toBe(true);
	});

	it("answers false for another message or another sender", async () => {
		seed({ email: "other@example.com", message: "Hello", createdDate: "2026-10-02 12:00:00" });
		seed({ email: CONTACT.email, message: "Goodbye", createdDate: "2026-10-02 12:00:00" });

		await expect(run(findContactWithMessage({ senderKey: SENDER_KEY, message: "Hello" }))).resolves.toBe(false);
	});

	it("propagates a DatabaseError rather than reading it as no match", async () => {
		contacts.database.exec("DROP TABLE contacts");

		expect(await runFail(findContactWithMessage({ senderKey: SENDER_KEY, message: "Hello" }))).toBeInstanceOf(
			DatabaseError,
		);
	});
});
