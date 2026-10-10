import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ACTIVATION_COOKIE } from "@application/dto/payment/types";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterAll(() => {
	vi.unstubAllGlobals();
});

const { verifyPremiumEmail, getExistingSession, claimActivationProof } = await import("./checkSession");

beforeEach(() => {
	mockFetch.mockReset();
});

describe("verifyPremiumEmail", () => {
	it("returns null when response is not ok", async () => {
		mockFetch.mockResolvedValue({ ok: false });

		expect(await verifyPremiumEmail("user@example.com")).toBeNull();
	});

	it("returns null when premiumKey is absent in response", async () => {
		mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({}) });

		expect(await verifyPremiumEmail("user@example.com")).toBeNull();
	});

	it("returns premiumKey when present", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ premiumKey: "pk_abc" }),
		});

		expect(await verifyPremiumEmail("user@example.com")).toEqual({ premiumKey: "pk_abc" });
	});

	it.each([
		["a non-string premium key", { premiumKey: 42 }],
		["an empty premium key", { premiumKey: "" }],
		["a body that is not an object", null],
	])("returns null when the body carries %s", async (_label, body) => {
		mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(body) });

		expect(await verifyPremiumEmail("user@example.com")).toBeNull();
	});

	it("sends email in request body", async () => {
		mockFetch.mockResolvedValue({ ok: false });

		await verifyPremiumEmail("test@domain.com");

		const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
		expect(JSON.parse(options.body as string)).toEqual({ email: "test@domain.com" });
	});
});

describe("getExistingSession", () => {
	it("throws when the check itself failed, so a server blip is never read as an absent session", async () => {
		mockFetch.mockResolvedValue({ ok: false, status: 500 });

		await expect(getExistingSession()).rejects.toThrow("500");
	});

	it("returns null when premiumKey is absent in response", async () => {
		mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ email: "user@example.com" }) });

		expect(await getExistingSession()).toBeNull();
	});

	it("returns the session when the body carries a premium key and an email", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ premiumKey: "pk_abc", email: "user@example.com" }),
		});

		expect(await getExistingSession()).toEqual({ premiumKey: "pk_abc", email: "user@example.com" });
	});

	it("returns null for the body the route answers when there is no session", async () => {
		mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ premiumKey: null, email: null }) });

		expect(await getExistingSession()).toBeNull();
	});

	it("returns only the session fields, whatever else the body carries", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ premiumKey: "pk_abc", email: "user@example.com", extra: true }),
		});

		expect(await getExistingSession()).toEqual({ premiumKey: "pk_abc", email: "user@example.com" });
	});

	it.each([
		["a non-string premium key", { premiumKey: 42, email: "user@example.com" }],
		["a premium key without an email", { premiumKey: "pk_abc", email: null }],
		["an email that is not a string", { premiumKey: "pk_abc", email: 7 }],
		["a body that is not an object", null],
	])("throws rather than reading %s as an answer, so a stored session is kept", async (_label, body) => {
		mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(body) });

		await expect(getExistingSession()).rejects.toThrow("check-session answered an unrecognised body");
	});

	it("uses a GET request with credentials included", async () => {
		mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({}) });

		await getExistingSession();

		const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("/api/check-session");
		expect(options).toEqual({ credentials: "include" });
	});
});

describe("the import that keeps zod out of every page's first load", () => {
	const source = readFileSync(resolve(process.cwd(), "src/ui/adapters/session/checkSession.ts"), "utf8");

	it("reaches the premium schemas through a dynamic import", () => {
		expect(source).toMatch(/import\(["']@application\/dto\/premium\/schema["']\)/);
	});

	it("has no value-level static import of them, nor of zod", () => {
		expect(source).not.toMatch(/^import (?!type )[^\n]*(?:dto\/premium\/schema|["']zod["'])/m);
	});
});

describe("claimActivationProof", () => {
	const setCookie = (cookie: string) => {
		// biome-ignore lint/suspicious/noDocumentCookie: the test plays the browser that receives the activation route's Set-Cookie
		document.cookie = cookie;
	};
	const proofIsHeld = () => document.cookie.split("; ").some((row) => row.startsWith(`${ACTIVATION_COOKIE}=`));

	afterEach(() => {
		setCookie(`${ACTIVATION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
		setCookie("user-country=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT");
	});

	it("answers yes once for the proof the activation route set, and spends it in the same call", () => {
		setCookie(`${ACTIVATION_COOKIE}=1; path=/`);

		expect(proofIsHeld()).toBe(true);
		expect(claimActivationProof()).toBe(true);
		expect(proofIsHeld()).toBe(false);
		expect(claimActivationProof()).toBe(false);
	});

	it("answers no when there is no proof, and leaves the other cookies alone", () => {
		setCookie("user-country=es; path=/");

		expect(claimActivationProof()).toBe(false);
		expect(document.cookie).toContain("user-country=es");
	});

	it("takes a cookie whose name only starts like the proof's for no proof", () => {
		setCookie(`${ACTIVATION_COOKIE}-other=1; path=/`);

		try {
			expect(claimActivationProof()).toBe(false);
		} finally {
			setCookie(`${ACTIVATION_COOKIE}-other=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
		}
	});
});
