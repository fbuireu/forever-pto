export interface ContactRepository {
  save(contact: SaveContactData): Promise<OperationResult>;
}

export interface SaveContactData {
  email: string;
  name: string;
  subject: string;
  message: string;
  messageId: string | null;
}

export interface OperationResult {
  success: boolean;
  error?: string;
}
