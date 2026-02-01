export interface ContactEmailData {
  email: string;
  name: string;
  subject: string;
  message: string;
  baseUrl: string;
}

export interface EmailRenderer {
  renderContactEmail(data: ContactEmailData): Promise<string>;
}
