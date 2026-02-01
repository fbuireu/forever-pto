export interface ContactData {
  email: string;
  name: string;
  subject: string;
  message: string;
  messageId: string | null;
}

export interface ContactRepository {
  save(data: ContactData): Promise<{ success: boolean; error?: string }>;
}
