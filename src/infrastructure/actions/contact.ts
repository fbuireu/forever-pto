'use server';

import { ContactFormData } from '@ui/modules/components/contact/schema';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContactEmail(data: ContactFormData) {
  try {
    // const validatedData = contactSchema.parse(data);

    // const email = createEmail({ ...validatedData });

    // const { data, error } = await resend.emails.send({
    //   from: `${params.name} <${atob(CONTACT_DETAILS.ENCODED_EMAIL_FROM)}>`,
    //   to: atob(CONTACT_DETAILS.ENCODED_EMAIL_BIANCA),
    //   subject: `${CONTACT_DETAILS.EMAIL_SUBJECT} from ${params.name} (${params.email})`,
    //   tags: [
    //     {
    //       name: 'category',
    //       value: 'web_contact_form',
    //     },
    //   ],
    //   html: email,
    // });

    // if (error) {
    //   console.error('Resend error:', error);
    //   return { success: false, error: 'Failed to send email. Please try again.' };
    // }

    return { success: true };
  } catch (error) {
    console.error('Contact form error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
