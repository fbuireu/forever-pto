import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockLoadStripe = vi.hoisted(() => vi.fn());

vi.mock("@stripe/stripe-js", () => ({
	loadStripe: mockLoadStripe,
}));

const mockStripe = { confirmPayment: vi.fn() };

const { getStripeClientInstance } = await import("./client");

beforeEach(() => {
	vi.clearAllMocks();
	mockLoadStripe.mockResolvedValue(mockStripe);
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("getStripeClientInstance", () => {
	it("throws when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing", async () => {
		vi.resetModules();
		vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "");
		const { getStripeClientInstance: freshClientInstance } = await import("./client");

		expect(() => freshClientInstance()).toThrow("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
	});

	it("returns the same instance on repeated calls", () => {
		expect(getStripeClientInstance()).toBe(getStripeClientInstance());
	});
});

describe("getStripePromise", () => {
	it("resolves to the Stripe instance", async () => {
		await expect(getStripeClientInstance().getStripePromise()).resolves.toBe(mockStripe);
	});

	it("loads Stripe.js once, however many Elements providers ask for it", async () => {
		vi.resetModules();
		const { getStripeClientInstance: freshClientInstance } = await import("./client");

		await freshClientInstance().getStripePromise();
		await freshClientInstance().getStripePromise();

		expect(mockLoadStripe).toHaveBeenCalledExactlyOnceWith("pk_test_123");
	});
});
