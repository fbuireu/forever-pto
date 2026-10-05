import { createFixtureTurso, type FixtureTurso } from "@infrastructure/clients/db/turso/fixture";

export const CONTACTS_TABLE = `CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  message_id TEXT,
  origin TEXT,
  created_date TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

export const createContactsFixture = (): FixtureTurso => createFixtureTurso(CONTACTS_TABLE);
