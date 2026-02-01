export interface PremiumSessionData {
  email: string;
  paymentIntentId: string;
}

export interface SessionVerificationResult {
  valid: boolean;
  data: PremiumSessionData | null;
}

export interface SessionRepository {
  create(data: PremiumSessionData): Promise<string>;
  verify(token: string): Promise<SessionVerificationResult>;
}
