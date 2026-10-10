import type { FullConfig } from "@playwright/test";
import { previewAccessHeaders } from "./previewAccess";

const WARM_UP_PATHS = ["/", "/en/this-route-does-not-exist-xyz"];
const WARM_UP_TIMEOUT_MS = 90_000;

const warmUp = async (config: FullConfig) => {
	const project = config.projects[0];
	if (!process.env.BASE_URL || !project?.use.baseURL) return;

	const headers = previewAccessHeaders();
	for (const path of WARM_UP_PATHS) {
		await fetch(new URL(path, project.use.baseURL), {
			headers,
			signal: AbortSignal.timeout(WARM_UP_TIMEOUT_MS),
		}).catch(() => undefined);
	}
};

export default warmUp;
