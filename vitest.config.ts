import { appendFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

export const summaryLabel = (label: string) => ({
	onTestRunEnd() {
		if (process.env.GITHUB_STEP_SUMMARY) {
			appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n## ${label}\n`);
		}
	},
});

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
		reporters: process.env.GITHUB_ACTIONS
			? ["default", summaryLabel("Contract suite (tests/docs-consistency.test.ts)"), "github-actions"]
			: ["default"],
	},
});
