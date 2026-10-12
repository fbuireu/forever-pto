import { defineConfig } from "vitest/config";
import { GithubActionsReporter, type Reporter, type TestModule } from "vitest/node";

const MIN_THRESHOLD = 85;

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
	resolve: {
		tsconfigPaths: true,
	},
	css: {
		postcss: { plugins: [] },
	},
	test: {
		environment: "happy-dom",
		testTimeout: 20_000,
		reporters: process.env.GITHUB_ACTIONS ? ["default", jobSummary(() => "Unit suite (forever-pto-web)")] : ["default"],
		env: {
			NEXT_PUBLIC_SITE_URL: "https://forever-pto.com",
		},
		setupFiles: ["./vitest.setup.ts"],
		exclude: [
			"e2e/**/*.spec.ts",
			"**/node_modules/**",
			"src/ui/assets/icons/**",
			"src/ui/i18n/messages/**",
			"src/ui/modules/bones/**",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"src/**/*.test.{ts,tsx}",
				"src/**/types.ts",
				"src/app/fonts.ts",
				"src/ui/modules/bones/**",
				"src/ui/assets/icons/**",
				"src/ui/modules/core/animate/icons/!(Icon).tsx",
				"src/ui/i18n/messages/**",
			],
			thresholds: {
				lines: MIN_THRESHOLD,
				functions: MIN_THRESHOLD,
				branches: MIN_THRESHOLD,
				statements: MIN_THRESHOLD,
			},
		},
	},
});
