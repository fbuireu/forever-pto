import { LOG_LEVEL, LOG_SERVICE, toLogLevel } from "../../src/infrastructure/clients/logging/better-stack/contract";

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

// Query strings carry credentials (Stripe appends payment_intent_client_secret to the confirmation
// return URL), so only origin + path is ever shipped off-worker.
function stripQuery(url: string | undefined): string | undefined {
	if (!url) return undefined;

	try {
		const parsed = new URL(url);

		return `${parsed.origin}${parsed.pathname}`;
	} catch {
		return undefined;
	}
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

		await fetch(env.BETTER_STACK_INGESTING_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.BETTER_STACK_SOURCE_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(entries),
		});
	},
};
