import type { SessionVerificationResult } from '@application/dto/premium/types';
import type { SessionRepository } from '@domain/payment/repository/session';

interface VerifySessionParams {
  sessionRepository: SessionRepository;
}

export const verifySession = async (token: string, params: VerifySessionParams): Promise<SessionVerificationResult> => {
  return params.sessionRepository.verify(token);
};
