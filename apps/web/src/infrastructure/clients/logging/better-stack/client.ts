import { Logtail } from "@logtail/edge";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { LOG_LEVEL, LOG_SERVICE, type LogLevel, stripQuery } from "./contract";

interface LogContext {
	[key: string]: unknown;
}

const UNCONFIGURED_WARNING =
	"BetterStack logging is disabled: NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN and NEXT_PUBLIC_BETTER_STACK_INGESTING_URL are not both defined";

let logtail: Logtail | null = null;
let warnedUnconfigured = false;

const getLogtail = () => {
	if (!logtail) {
		const sourceToken = process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN;
		const ingestingUrl = process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_URL;

		if (!sourceToken || !ingestingUrl) {
			if (!warnedUnconfigured) {
				warnedUnconfigured = true;
				console.warn(UNCONFIGURED_WARNING);
			}

			return null;
		}

		logtail = new Logtail(sourceToken, { endpoint: ingestingUrl, warnAboutMissingExecutionContext: false });
	}

	return logtail;
};

const getExecutionContext = () => {
	try {
		const { ctx } = getCloudflareContext();
		return ctx;
	} catch {
		return undefined;
	}
};

const send = (level: LogLevel, message: string, context: LogContext) => {
	try {
		void getLogtail()?.[level](message, context, getExecutionContext());
	} catch {
		return;
	}
};

export class BetterStackClient {
	private readonly baseContext: LogContext;

	constructor(baseContext?: LogContext) {
		this.baseContext = {
			environment: process.env.NODE_ENV || "development",
			service: LOG_SERVICE,
			...baseContext,
		};
	}

	private getFullContext(context?: LogContext) {
		const merged: LogContext = {
			...this.baseContext,
			...context,
		};

		return typeof merged.url === "string" ? { ...merged, url: stripQuery(merged.url) } : merged;
	}

	debug(message: string, context?: LogContext) {
		send(LOG_LEVEL.DEBUG, message, this.getFullContext(context));
	}

	info(message: string, context?: LogContext) {
		send(LOG_LEVEL.INFO, message, this.getFullContext(context));
	}

	warn(message: string, context?: LogContext) {
		send(LOG_LEVEL.WARN, message, this.getFullContext(context));
	}

	error(message: string, context?: LogContext) {
		send(LOG_LEVEL.ERROR, message, this.getFullContext(context));
	}

	logError(message: string, error: unknown, context?: LogContext) {
		const errorContext: LogContext = {
			...context,
			error: {
				message: error instanceof Error ? error.message : String(error),
				name: error instanceof Error ? error.name : "UnknownError",
				stack: error instanceof Error ? error.stack : undefined,
				...(error instanceof Error && Object.keys(error).length > 0
					? Object.fromEntries(Object.entries(error).filter(([key]) => !["message", "name", "stack"].includes(key)))
					: {}),
			},
		};

		this.error(message, errorContext);
	}

	logDuration(operation: string, durationMs: number, context?: LogContext) {
		this.info(`${operation} completed`, {
			...context,
			duration_ms: durationMs,
			duration_seconds: durationMs / 1000,
		});
	}

	async measureAsync<T>(operation: string, fn: () => Promise<T>, context?: LogContext) {
		const startTime = performance.now();
		try {
			const result = await fn();
			const duration = performance.now() - startTime;
			this.logDuration(operation, duration, { ...context, status: "success" });
			return result;
		} catch (error) {
			const duration = performance.now() - startTime;
			this.logError(`${operation} failed`, error, {
				...context,
				duration_ms: duration,
				status: "error",
			});
			throw error;
		}
	}

	withContext(context: LogContext) {
		return new BetterStackClient({ ...this.baseContext, ...context });
	}
}

let instance: BetterStackClient | null = null;

export const getBetterStackInstance = () => {
	instance ??= new BetterStackClient();
	return instance;
};
