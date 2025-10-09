'use server';

import { getTursoClient } from '@infrastructure/db/turso/client';
import { ContactFormEmail } from '@infrastructure/services/email/templates/Contact';
import { render } from '@react-email/render';
import { ContactFormData, contactSchema } from '@ui/modules/components/contact/schema';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const turso = getTursoClient();

export async function sendContactEmail(data: ContactFormData) {
  try {
    const { email, name, subject, message } = contactSchema.parse(data);

    const emailHtml = await render(
      ContactFormEmail({
        email,
        name,
        subject,
        message,
      })
    );

    const { data: result, error } = await resend.emails.send({
      from: 'Forever PTO <contact@forever-pto.com>',
      to: 'your@email.com',
      subject: `[Forever PTO Contact] ${subject}`,
      html: emailHtml,
      replyTo: email,
      tags: [
        {
          name: 'category',
          value: 'web_contact_form',
        },
      ],
    });

    if (error) {
      return { success: false, error: 'Failed to send email. Please try again.' };
    }

    const dbResult = await turso.execute(
      `INSERT INTO contacts (email, name, subject, message, message_id, created_date, updated_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [email, name, subject, message, result.id || null]
    );

    if (!dbResult.success) {
      console.error('Failed to save contact to database:', dbResult.error);
      return {
        success: false,
        error: 'Email sent but failed to save contact. Please try again.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Contact form error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
