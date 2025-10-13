import type { ContactData } from '@application/dto/contact/types';
import type { ContactRepository } from '@domain/contact/repository/types';
import type { TursoClient } from '@infrastructure/clients/db/turso/client';

export const saveContact = async (
  turso: TursoClient,
  data: ContactData
): Promise<{ success: boolean; error?: string }> => {
  const result = await turso.execute(
    `INSERT INTO contacts (email, name, subject, message, message_id, created_date, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [data.email, data.name, data.subject, data.message, data.messageId]
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
};

export const createContactRepository = (turso: TursoClient): ContactRepository => ({
  save: (contact: ContactData) => saveContact(turso, contact),
});
