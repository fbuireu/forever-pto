import {
	LOG_LEVEL,
	LOG_SERVICE,
	stripQuery,
	toLogLevel,
} from "../../src/infrastructure/clients/logging/better-stack/contract";

interface Env {
	BETTER_STACK_SOURCE_TOKEN: string;
	BETTER_STACK_INGESTING_URL: string;
}

interface TailEvent {
	event: {
		request?: { url: string; method: string; headers: Record<string, string> };
		response?: { status: number };
	} | null;
	eventTimestamp: number;
	logs: Array<{ message: unknown[]; level: string; timestamp: number }>;
	exceptions: Array<{ name: string; message: string; timestamp: number }>;
	outcome: string;
	scriptName: string;
}

export default {
	async tail(events: TailEvent[], env: Env): Promise<void> {
		const entries = events.flatMap((event) => {
			const base = {
				service: LOG_SERVICE,
				script: event.scriptName,
				outcome: event.outcome,
				url: stripQuery(event.event?.request?.url),
				method: event.event?.request?.method,
				status: event.event?.response?.status,
			};

			const logs = event.logs.map((log) => ({
				dt: new Date(log.timestamp).toISOString(),
				level: toLogLevel(log.level),
				message: log.message.map(String).join(" "),
				...base,
			}));

			const exceptions = event.exceptions.map((ex) => ({
				dt: new Date(ex.timestamp).toISOString(),
				level: LOG_LEVEL.ERROR,
				message: `${ex.name}: ${ex.message}`,
				...base,
			}));

			return [...logs, ...exceptions];
		});

		if (entries.length === 0) return;

		try {
			const response = await fetch(env.BETTER_STACK_INGESTING_URL, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.BETTER_STACK_SOURCE_TOKEN}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(entries),
			});

			if (!response.ok) {
				// biome-ignore lint/suspicious/noConsole: the tail consumer is the log sink, so its own failures have nowhere else to go
				console.error(
					`${LOG_SERVICE}-tail: ingest rejected ${entries.length} entries with ${response.status} ${response.statusText}`,
				);
			}
		} catch (error) {
			// biome-ignore lint/suspicious/noConsole: the tail consumer is the log sink, so its own failures have nowhere else to go
			console.error(`${LOG_SERVICE}-tail: ingest unreachable, dropped ${entries.length} entries: ${String(error)}`);
		}
	},
};
