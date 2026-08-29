import { SessionError } from "@infrastructure/errors";

export class MissingJWTSecret extends Error {}

export class SessionConfigurationError extends SessionError {}

export const isSessionConfigurationError = (error: SessionError): error is SessionConfigurationError =>
	error instanceof SessionConfigurationError;

export const wrapSessionError = (error: unknown): SessionError => {
	const message = error instanceof Error ? error.message : String(error);

	if (error instanceof MissingJWTSecret) {
		return new SessionConfigurationError({ message, cause: error });
	}

	return new SessionError({ message, cause: error });
};
