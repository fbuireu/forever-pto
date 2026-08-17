import { describe, expect, it } from 'vitest';
import { contactSchema, createContactSchema } from './schema';

const VALID = {
  email: 'user@example.com',
  name: 'John Doe',
  subject: 'Hello there',
  message: 'This is a valid message body.',
};

describe('contactSchema', () => {
  describe('valid input', () => {
    it('accepts a fully valid payload', () => {
      expect(contactSchema.safeParse(VALID).success).toBe(true);
    });
  });

  describe('email validation', () => {
    it('rejects an invalid email format', () => {
      const result = contactSchema.safeParse({ ...VALID, email: 'not-an-email' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe('invalid_email');
    });

    it('rejects a missing email', () => {
      const { email: _, ...rest } = VALID;
      expect(contactSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe('name validation', () => {
    it('accepts name at minimum length (2)', () => {
      expect(contactSchema.safeParse({ ...VALID, name: 'Jo' }).success).toBe(true);
    });

    it('rejects name below minimum (1 char)', () => {
      const result = contactSchema.safeParse({ ...VALID, name: 'J' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe('name_too_short');
    });

    it('accepts name at maximum length (100)', () => {
      expect(contactSchema.safeParse({ ...VALID, name: 'a'.repeat(100) }).success).toBe(true);
    });

    it('rejects name above maximum (101 chars)', () => {
      const result = contactSchema.safeParse({ ...VALID, name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe('name_too_long');
    });
  });

  describe('subject validation', () => {
    it('accepts subject at minimum length (5)', () => {
      expect(contactSchema.safeParse({ ...VALID, subject: 'Hello' }).success).toBe(true);
    });

    it('rejects subject below minimum (4 chars)', () => {
      const result = contactSchema.safeParse({ ...VALID, subject: 'Hi!!' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe('subject_too_short');
    });

    it('accepts subject at maximum length (200)', () => {
      expect(contactSchema.safeParse({ ...VALID, subject: 'a'.repeat(200) }).success).toBe(true);
    });

    it('rejects subject above maximum (201 chars)', () => {
      const result = contactSchema.safeParse({ ...VALID, subject: 'a'.repeat(201) });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe('subject_too_long');
    });
  });

  describe('message validation', () => {
    it('accepts message at minimum length (10)', () => {
      expect(contactSchema.safeParse({ ...VALID, message: '1234567890' }).success).toBe(true);
    });

    it('rejects message below minimum (9 chars)', () => {
      const result = contactSchema.safeParse({ ...VALID, message: '123456789' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe('message_too_short');
    });

    it('accepts message at maximum length (1000)', () => {
      expect(contactSchema.safeParse({ ...VALID, message: 'a'.repeat(1000) }).success).toBe(true);
    });

    it('rejects message above maximum (1001 chars)', () => {
      const result = contactSchema.safeParse({ ...VALID, message: 'a'.repeat(1001) });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe('message_too_long');
    });
  });
});

describe('createContactSchema', () => {
  const schema = createContactSchema({
    invalidEmail: 'Bad email',
    emailRequired: 'Email needed',
    nameMin: 'Name too short',
    nameMax: 'Name too long',
    subjectMin: 'Subject too short',
    subjectMax: 'Subject too long',
    messageMin: 'Message too short',
    messageMax: 'Message too long',
  });

  it('uses the provided invalidEmail message', () => {
    const result = schema.safeParse({ ...VALID, email: 'bad' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Bad email');
  });

  it('uses the provided nameMin message', () => {
    const result = schema.safeParse({ ...VALID, name: 'J' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Name too short');
  });

  it('uses the provided nameMax message', () => {
    const result = schema.safeParse({ ...VALID, name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Name too long');
  });

  it('uses the provided subjectMin message', () => {
    const result = schema.safeParse({ ...VALID, subject: 'Hi!!' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Subject too short');
  });

  it('uses the provided subjectMax message', () => {
    const result = schema.safeParse({ ...VALID, subject: 'a'.repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Subject too long');
  });

  it('uses the provided messageMin message', () => {
    const result = schema.safeParse({ ...VALID, message: '123456789' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Message too short');
  });

  it('uses the provided messageMax message', () => {
    const result = schema.safeParse({ ...VALID, message: 'a'.repeat(1001) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Message too long');
  });
});
