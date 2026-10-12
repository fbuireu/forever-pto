import { defineConfig } from "vitest/config";
import { GithubActionsReporter, type Reporter, type TestModule } from "vitest/node";

const jobSummary = (titleOf: (testModules: readonly TestModule[]) => string): Reporter => {
	const github = new GithubActionsReporter();

	return {
		onInit: (vitest) => github.onInit(vitest),
		onTestCaseAnnotate: (testCase, annotation) => github.onTestCaseAnnotate(testCase, annotation),
		onTestRunEnd: (testModules, unhandledErrors) => {
			if (testModules.length === 0 && unhandledErrors.length === 0) return;
			github.options.jobSummary.title = titleOf(testModules);
			github.onTestRunEnd(testModules, unhandledErrors);
		},
	};
};

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
		reporters: process.env.GITHUB_ACTIONS
			? ["default", jobSummary(() => "Contract suite (tests/docs-consistency.test.ts)")]
			: ["default"],
	},
});
