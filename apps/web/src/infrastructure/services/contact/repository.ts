import type { ContactData } from "@application/dto/contact/types";
import { TursoService } from "@infrastructure/clients/db/turso/service";
import type { DatabaseError } from "@infrastructure/errors";
import { Effect } from "effect";

export const saveContact = (data: ContactData): Effect.Effect<void, DatabaseError, TursoService> =>
	Effect.gen(function* () {
		const turso = yield* TursoService;
		const id = crypto.randomUUID();
		yield* turso.execute(
			`INSERT INTO contacts (id, email, name, subject, message, message_id, origin, created_date, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
			[id, data.email, data.name, data.subject, data.message, data.messageId ?? null, data.origin ?? null],
		);
	});

const NORMALISED = "email";
const SENDER_KEY = `CASE
    WHEN instr(lower(trim(${NORMALISED})), '+') > 0
     AND instr(lower(trim(${NORMALISED})), '+') < instr(lower(trim(${NORMALISED})), '@')
    THEN substr(lower(trim(${NORMALISED})), 1, instr(lower(trim(${NORMALISED})), '+') - 1)
      || substr(lower(trim(${NORMALISED})), instr(lower(trim(${NORMALISED})), '@'))
    ELSE lower(trim(${NORMALISED}))
  END`;

export interface FindLatestContactSinceParams {
	senderKey: string;
	since: string;
}

export const findLatestContactSince = ({
	senderKey,
	since,
}: FindLatestContactSinceParams): Effect.Effect<boolean, DatabaseError, TursoService> =>
	Effect.gen(function* () {
		const turso = yield* TursoService;
		const rows = yield* turso.query<{ id: string }>(
			`SELECT id FROM contacts WHERE ${SENDER_KEY} = ? AND created_date >= ? LIMIT 1`,
			[senderKey, since],
		);

		return rows.length > 0;
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
