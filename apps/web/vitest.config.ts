import { defineConfig } from "vitest/config";
import { summaryLabel } from "../../vitest.config";

const MIN_THRESHOLD = 85;

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "happy-dom",
		reporters: process.env.GITHUB_ACTIONS
			? ["default", summaryLabel("Unit suite (forever-pto-web)"), "github-actions"]
			: ["default"],
		env: {
			NEXT_PUBLIC_SITE_URL: "https://forever-pto.com",
		},
		setupFiles: ["./vitest.setup.ts"],
		exclude: [
			"e2e/**",
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
				"src/**/*.spec.{ts,tsx}",
				"src/**/*.d.ts",
				"src/**/types.ts",
				"src/**/*.types.ts",
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
