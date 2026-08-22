import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetCloudflareContext, mockCacheLife } = vi.hoisted(() => ({
	mockGetCloudflareContext: vi.fn(),
	mockCacheLife: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: mockGetCloudflareContext }));
vi.mock("next/cache", () => ({ cacheLife: mockCacheLife }));

const { getPublicEnv } = await import("./getPublicEnv");

beforeEach(() => {
	vi.clearAllMocks();
	mockGetCloudflareContext.mockResolvedValue({
		env: {
			NEXT_PUBLIC_SITE_URL: "https://forever-pto.com",
			NEXT_PUBLIC_CONTACT_EMAIL: "contact@forever-pto.com",
		},
	});
});

describe("getPublicEnv", () => {
	it("maps the two public bindings onto the caller-facing names", async () => {
		await expect(getPublicEnv()).resolves.toEqual({
			siteUrl: "https://forever-pto.com",
			contactEmail: "contact@forever-pto.com",
		});
	});

	it('reads the Cloudflare context in its async form, the only one valid under "use cache"', async () => {
		await getPublicEnv();
		expect(mockGetCloudflareContext).toHaveBeenCalledWith({ async: true });
	});

	it("declares a cache lifetime, so a dozen call sites do not each re-enter the runtime", async () => {
		await getPublicEnv();
		expect(mockCacheLife).toHaveBeenCalledWith("days");
	});

	it('keeps the "use cache" directive, which nothing else in the module system enforces', () => {
		const source = readFileSync(resolve(process.cwd(), "src/infrastructure/services/env/getPublicEnv.ts"), "utf8");
		expect(source).toMatch(/["']use cache["']/);
	});
});
