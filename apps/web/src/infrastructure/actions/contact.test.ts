import { EmailError, type ValidationError } from "@infrastructure/errors";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSendContactEmail = vi.hoisted(() =>
	vi.fn<
		(
			data: unknown,
			config: unknown,
		) => Effect.Effect<{ deferred: Effect.Effect<void, never, never> }, ValidationError | EmailError>
	>(),
);

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

const { sendContactEmailAction } = await import("./contact");

const validData = { name: "Test", email: "test@example.com", subject: "Hello", message: "World" };

describe("sendContactEmailAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSendContactEmail.mockReturnValue(Effect.succeed({ deferred: Effect.void }));
	});

	it("returns the operation's body", async () => {
		const result = await sendContactEmailAction(validData);

		expect(result).toEqual({ success: true });
	});

	it("hands the operation the request-scoped site URL and contact address", async () => {
		await sendContactEmailAction(validData);

		expect(mockSendContactEmail).toHaveBeenCalledWith(validData, {
			siteUrl: "https://example.com",
			contactEmail: "contact@example.com",
		});
	});

	it("drops the status, which is the only thing it does differently from the route", async () => {
		mockSendContactEmail.mockReturnValue(Effect.fail(new EmailError({ message: "SMTP failed" })));

		const result = await sendContactEmailAction(validData);

		expect(result).not.toHaveProperty("status");
		expect(result.success).toBe(false);
	});
});
