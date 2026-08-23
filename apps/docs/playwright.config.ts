import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const DIST = fileURLToPath(new URL("./dist", import.meta.url));

if (!existsSync(DIST)) {
	throw new Error(
		"apps/docs/dist is missing. `astro preview` serves the build, it does not produce it, and the demo pages are discovered from it: run `pnpm --filter forever-pto-docs build` first.",
	);
}

export default defineConfig({
	testDir: "./e2e",
	timeout: 30_000,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
	use: {
		baseURL: "http://localhost:4321",
		trace: "on-first-retry",
	},
	webServer: {
		command: "pnpm preview",
		url: "http://localhost:4321",
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
