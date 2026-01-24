import { PremiumSessionData, SessionVerificationResult } from "@application/dto/premium/types";

export interface SessionRepository {
  create(data: PremiumSessionData): Promise<string>;
  verify(token: string): Promise<SessionVerificationResult>;
}
