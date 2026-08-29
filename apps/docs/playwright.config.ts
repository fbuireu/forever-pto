import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const DIST = fileURLToPath(new URL("./dist", import.meta.url));
const LOCAL_URL = "http://localhost:4321";
const deployedUrl = process.env.BASE_URL;

if (!deployedUrl && !existsSync(DIST)) {
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
		baseURL: deployedUrl ?? LOCAL_URL,
		trace: "on-first-retry",
	},
	webServer: deployedUrl
		? undefined
		: {
				command: "pnpm preview",
				url: LOCAL_URL,
				reuseExistingServer: !process.env.CI,
				timeout: 60_000,
			},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
