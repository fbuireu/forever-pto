export interface PremiumSessionData {
  email: string;
  paymentIntentId: string;
}

export interface PremiumActivationResult {
  success: boolean;
  premiumKey: string | null;
  email: string | null;
  token?: string;
  error?: string;
}

export interface SessionVerificationResult {
  valid: boolean;
  data: PremiumSessionData | null;
}
