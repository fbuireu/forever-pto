export interface PremiumActivationResult {
  success: boolean;
  premiumKey: string | null;
  email: string | null;
  token?: string;
  error?: string;
}
