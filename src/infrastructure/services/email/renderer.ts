import type { ContactEmailData, EmailRenderer } from '@application/interfaces/email-renderer';
import { ContactFormEmail } from './templates/Contact';
import { render } from '@react-email/render';

export const createEmailRenderer = (): EmailRenderer => ({
  renderContactEmail: async (data: ContactEmailData): Promise<string> => {
    return render(ContactFormEmail(data));
  },
});
