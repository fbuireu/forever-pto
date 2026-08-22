import type { BetterStackClient } from "@infrastructure/clients/logging/better-stack/client";

type LogContext = Record<string, unknown>;

export const logClient = (write: (logger: BetterStackClient) => void): void => {
	void import("@infrastructure/clients/logging/better-stack/client")
		.then(({ getBetterStackInstance }) => {
			write(getBetterStackInstance());
		})
		.catch(() => {});
};

export const logClientError = (message: string, error: unknown, context?: LogContext): void => {
	logClient((logger) => {
		logger.logError(message, error, context);
	});
};
