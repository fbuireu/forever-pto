import { describe, expect, it } from "vitest";
import { mcpServerCard } from "./mcpServerCard";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;
if (!BASE_URL) throw new Error("vitest.config.ts sets NEXT_PUBLIC_SITE_URL for the unit suite");

describe("mcpServerCard", () => {
	it("sets schemaVersion to v1", () => {
		const body = mcpServerCard(BASE_URL);
		expect(body.schemaVersion).toBe("v1");
	});

	it("sets serverInfo url to baseUrl", () => {
		const { serverInfo } = mcpServerCard(BASE_URL);
		expect(serverInfo.url).toBe(BASE_URL);
	});

	it("declares no capabilities", () => {
		const { capabilities } = mcpServerCard(BASE_URL);
		expect(capabilities).toEqual({ resources: false, tools: false, prompts: false });
	});
});
