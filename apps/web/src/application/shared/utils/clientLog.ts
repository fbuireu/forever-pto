import type { Logger } from "@infrastructure/logging/logger";

type LogContext = Record<string, unknown>;

export const logClient = (write: (logger: Logger) => void): void => {
	void import("@infrastructure/logging/logger")
		.then(({ logger }) => {
			write(logger);
		})
		.catch(() => {});
};

export interface LogClientErrorParams {
	message: string;
	error: unknown;
	context?: LogContext;
}

export const logClientError = ({ message, error, context }: LogClientErrorParams): void => {
	logClient((logger) => {
		logger.logError({ message, error, context });
	});
};
