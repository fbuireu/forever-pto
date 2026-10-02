import type { ContactData } from "@application/dto/contact/types";
import { TursoService } from "@infrastructure/clients/db/turso/service";
import type { DatabaseError } from "@infrastructure/errors";
import { Effect } from "effect";

const NORMALISED = "email";
const SENDER_KEY = `CASE
    WHEN instr(lower(trim(${NORMALISED})), '+') > 0
     AND instr(lower(trim(${NORMALISED})), '+') < instr(lower(trim(${NORMALISED})), '@')
    THEN substr(lower(trim(${NORMALISED})), 1, instr(lower(trim(${NORMALISED})), '+') - 1)
      || substr(lower(trim(${NORMALISED})), instr(lower(trim(${NORMALISED})), '@'))
    ELSE lower(trim(${NORMALISED}))
  END`;

export interface ReserveContactSlotParams {
	senderKey: string;
	since: string;
	contact: ContactData;
}

export const reserveContactSlot = ({
	senderKey,
	since,
	contact,
}: ReserveContactSlotParams): Effect.Effect<string | null, DatabaseError, TursoService> =>
	Effect.gen(function* () {
		const turso = yield* TursoService;
		const id = crypto.randomUUID();
		const inserted = yield* turso.execute(
			`INSERT INTO contacts (id, email, name, subject, message, message_id, origin, created_date, updated_at)
       SELECT ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
       WHERE NOT EXISTS (
         SELECT 1 FROM contacts WHERE ${SENDER_KEY} = ? AND (created_date >= datetime(?) OR message = ?)
       )`,
			[
				id,
				contact.email,
				contact.name,
				contact.subject,
				contact.message,
				contact.messageId,
				contact.origin,
				senderKey,
				since,
				contact.message,
			],
		);

		return inserted > 0 ? id : null;
	});

export const releaseContactSlot = (id: string): Effect.Effect<void, DatabaseError, TursoService> =>
	Effect.gen(function* () {
		const turso = yield* TursoService;
		yield* turso.execute("DELETE FROM contacts WHERE id = ?", [id]);
	});

export interface RecordContactMessageIdParams {
	id: string;
	messageId: string | null;
}

export const recordContactMessageId = ({
	id,
	messageId,
}: RecordContactMessageIdParams): Effect.Effect<void, DatabaseError, TursoService> =>
	Effect.gen(function* () {
		const turso = yield* TursoService;
		yield* turso.execute("UPDATE contacts SET message_id = ?, updated_at = datetime('now') WHERE id = ?", [
			messageId,
			id,
		]);
	});

export interface FindContactWithMessageParams {
	senderKey: string;
	message: string;
}

export const findContactWithMessage = ({
	senderKey,
	message,
}: FindContactWithMessageParams): Effect.Effect<boolean, DatabaseError, TursoService> =>
	Effect.gen(function* () {
		const turso = yield* TursoService;
		const rows = yield* turso.query<{ id: string }>(
			`SELECT id FROM contacts WHERE ${SENDER_KEY} = ? AND message = ? LIMIT 1`,
			[senderKey, message],
		);

		return rows.length > 0;
	});
