import type { SessionRepository, SessionVerificationResult } from '@domain/session/repository/types';

interface VerifySessionParams {
  sessionRepository: SessionRepository;
}

export const verifySession = async (token: string, params: VerifySessionParams): Promise<SessionVerificationResult> => {
  return params.sessionRepository.verify(token);
};
