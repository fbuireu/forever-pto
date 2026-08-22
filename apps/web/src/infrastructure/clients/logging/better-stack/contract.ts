export const LOG_SERVICE = "forever-pto";

export const LOG_LEVEL = {
	DEBUG: "debug",
	INFO: "info",
	WARN: "warn",
	ERROR: "error",
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

const LEVELS = new Set<string>(Object.values(LOG_LEVEL));

export const toLogLevel = (level: string): LogLevel => (LEVELS.has(level) ? (level as LogLevel) : LOG_LEVEL.INFO);
