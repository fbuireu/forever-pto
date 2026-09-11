import { getCloudflareContext } from "@opennextjs/cloudflare";

const tracing = () => {
	try {
		return getCloudflareContext().ctx.tracing;
	} catch {
		return undefined;
	}
};

export interface TracedParams<T> {
	name: string;
	run: () => Promise<T>;
}

export const traced = <T>({ name, run }: TracedParams<T>): Promise<T> => {
	const api = tracing();

	return api ? api.enterSpan(name, run) : run();
};
