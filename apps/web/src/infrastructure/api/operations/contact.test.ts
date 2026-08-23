import { ApiError } from "@infrastructure/api/errors";
import { EmailError, ValidationError } from "@infrastructure/errors";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSendContactEmail = vi.hoisted(() =>
	vi.fn<
		(body: unknown, config: unknown) => Effect.Effect<{ deferred: Effect.Effect<void> }, ValidationError | EmailError>
	>(),
);
const mockAfter = vi.hoisted(() => vi.fn((work: () => unknown) => work()));

vi.mock("@application/use-cases/contact", () => ({ sendContactEmail: mockSendContactEmail }));
vi.mock("@infrastructure/layers", () => ({ ApplicationLayer: Layer.empty }));
vi.mock("next/server", () => ({ after: mockAfter }));

const { sendContactRequest } = await import("./contact");

const CONFIG = { siteUrl: "https://forever-pto.com", contactEmail: "contact@forever-pto.com" };
const INPUT = { name: "Alice", email: "alice@example.com", subject: "Hi", message: "Hello" };

beforeEach(() => {
	vi.clearAllMocks();
	mockSendContactEmail.mockReturnValue(Effect.succeed({ deferred: Effect.void }));
});

describe("sendContactRequest", () => {
	it("answers 200 on success, whichever transport called it", async () => {
		const outcome = await sendContactRequest({ input: Effect.succeed(INPUT), config: CONFIG });

		expect(outcome).toEqual({ status: 200, body: { success: true } });
		expect(mockSendContactEmail).toHaveBeenCalledWith({ data: INPUT, config: CONFIG });
	});

	it("maps a malformed body to 400 carrying the code the parser raised", async () => {
		const outcome = await sendContactRequest({
			input: Effect.fail(new ValidationError({ message: "invalid_body" })),
			config: CONFIG,
		});

		expect(outcome).toEqual({ status: 400, body: { success: false, error: "invalid_body" } });
		expect(mockSendContactEmail).not.toHaveBeenCalled();
	});

	it("maps a rejected field to 400 carrying the schema code", async () => {
		mockSendContactEmail.mockReturnValue(Effect.fail(new ValidationError({ message: "email_required" })));

		const outcome = await sendContactRequest({ input: Effect.succeed(INPUT), config: CONFIG });

		expect(outcome).toEqual({ status: 400, body: { success: false, error: "email_required" } });
	});

	it("maps a mail failure to 500 without leaking the reason", async () => {
		mockSendContactEmail.mockReturnValue(Effect.fail(new EmailError({ message: "resend exploded" })));

		const outcome = await sendContactRequest({ input: Effect.succeed(INPUT), config: CONFIG });

		expect(outcome).toEqual({ status: 500, body: { success: false, error: ApiError.INTERNAL_ERROR } });
	});

	it("defers sending so it cannot delay the reply", async () => {
		const sent = vi.fn();
		mockSendContactEmail.mockReturnValue(Effect.succeed({ deferred: Effect.sync(sent) }));

		await sendContactRequest({ input: Effect.succeed(INPUT), config: CONFIG });

		expect(mockAfter).toHaveBeenCalled();
		expect(sent).toHaveBeenCalled();
	});
});
