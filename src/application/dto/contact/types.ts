export interface ContactFormData {
  email: string;
  name: string;
  subject: string;
  message: string;
}

export interface ContactResult {
  success: boolean;
  error?: string;
}

export interface ContactData {
  email: string;
  name: string;
  subject: string;
  message: string;
  messageId: string | null;
}
