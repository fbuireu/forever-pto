import type { SessionVerificationResult } from '@application/dto/premium/types';
import type { SessionRepository } from '@domain/payment/repository/session';

interface VerifySessionDeps {
  sessionRepository: SessionRepository;
}

export const verifySession = async (token: string, deps: VerifySessionDeps): Promise<SessionVerificationResult> => {
  return deps.sessionRepository.verify(token);
};
