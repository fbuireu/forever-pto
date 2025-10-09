'use server';

import { ContactFormEmail } from '@infrastructure/services/email/templates/Contact';
import { render } from '@react-email/render';
import { ContactFormData, contactSchema } from '@ui/modules/components/contact/schema';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // todo: save contact email

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
      console.error('Resend error:', error);
      return { success: false, error: 'Failed to send email. Please try again.' };
    }

    console.log('Email sent successfully:', result);
    return { success: !!data };
  } catch (error) {
    console.error('Contact form error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
