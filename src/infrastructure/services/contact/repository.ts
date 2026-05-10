import type { ContactData } from '@application/dto/contact/types';
import { TursoService } from '@infrastructure/clients/db/turso/service';
import type { DatabaseError } from '@infrastructure/errors';
import { Effect } from 'effect';

export const saveContact = (data: ContactData): Effect.Effect<void, DatabaseError, TursoService> =>
  Effect.gen(function* () {
    const turso = yield* TursoService;
    const id = crypto.randomUUID();
    yield* turso.execute(
      `INSERT INTO contacts (id, email, name, subject, message, message_id, origin, created_date, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, data.email, data.name, data.subject, data.message, data.messageId ?? null, data.origin ?? null]
    );
  });
