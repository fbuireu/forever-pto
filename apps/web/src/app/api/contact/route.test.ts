import type { sendContactEmail } from "@application/use-cases/contact";
import { INVALID_BODY } from "@infrastructure/api/parseJsonBody";
import { DuplicateContactError } from "@infrastructure/errors";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSendContactEmail = vi.hoisted(() => vi.fn<typeof sendContactEmail>());

vi.mock("@application/use-cases/contact", () => ({
	sendContactEmail: mockSendContactEmail,
}));

vi.mock("@infrastructure/layers", () => ({
	ApplicationLayer: Layer.empty,
}));

vi.mock("next/server", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next/server")>();
	return { ...actual, after: vi.fn() };
});

vi.mock("@opennextjs/cloudflare", () => ({
	getCloudflareContext: vi.fn().mockReturnValue({
		env: {
			NEXT_PUBLIC_SITE_URL: "https://example.com",
			NEXT_PUBLIC_CONTACT_EMAIL: "contact@example.com",
		},
	}),
}));

const { POST } = await import("./route");

const SUBMISSION = { email: "test@example.com", name: "Test", subject: "Hello", message: "World" };

function makeRequest(body: BodyInit | null): Request {
	return new Request("http://localhost/api/contact", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body,
	});
}

describe("POST /api/contact", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSendContactEmail.mockReturnValue(Effect.succeed({ deferred: Effect.void }));
	});

	it("puts the operation's body and status on a NextResponse", async () => {
		const response = await POST(makeRequest(JSON.stringify(SUBMISSION)) as never);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true });
	});

	it("hands the operation the request-scoped site URL and contact address", async () => {
		await POST(makeRequest(JSON.stringify(SUBMISSION)) as never);

		expect(mockSendContactEmail).toHaveBeenCalledWith({
			data: SUBMISSION,
			config: { siteUrl: "https://example.com", contactEmail: "contact@example.com" },
		});
	});

	it("hands the operation parseJsonBody, so an unreadable body answers 400 rather than a bare 500", async () => {
		const response = await POST(makeRequest("{not json") as never);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ success: false, error: INVALID_BODY });
		expect(mockSendContactEmail).not.toHaveBeenCalled();
	});

	it("keeps every answer out of any cache, since each one is this sender's outcome", async () => {
		mockSendContactEmail.mockReturnValueOnce(Effect.fail(new DuplicateContactError({ reason: "cooldown" })));

		const answers = [
			await POST(makeRequest(JSON.stringify(SUBMISSION)) as never),
			await POST(makeRequest(JSON.stringify(SUBMISSION)) as never),
			await POST(makeRequest("{not json") as never),
		];

		expect(answers.map(({ status }) => status)).toEqual([429, 200, 400]);
		expect(answers.map(({ headers }) => headers.get("Cache-Control"))).toEqual(["no-store", "no-store", "no-store"]);
	});
});
