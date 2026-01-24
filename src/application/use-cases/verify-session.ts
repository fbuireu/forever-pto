import type { SessionVerificationResult } from '@application/dto/premium/types';
import { SessionRepository } from '@domain/session/repository/types';

interface VerifySessionParams {
  sessionRepository: SessionRepository;
}

export const verifySession = async (token: string, params: VerifySessionParams): Promise<SessionVerificationResult> => {
  return params.sessionRepository.verify(token);
};
