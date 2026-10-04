import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockLoadStripe = vi.hoisted(() => vi.fn());

vi.mock("@stripe/stripe-js/pure", () => ({
	loadStripe: mockLoadStripe,
}));

const mockStripe = { confirmPayment: vi.fn() };

const { getStripeClientInstance } = await import("./client");

beforeEach(() => {
	vi.clearAllMocks();
	mockLoadStripe.mockResolvedValue(mockStripe);
	vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_123");
});

afterEach(() => {
	vi.unstubAllEnvs();
});

const freshClient = async () => {
	vi.resetModules();
	const { getStripeClientInstance: fresh } = await import("./client");

	return fresh();
};

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

	it("does not fetch Stripe.js until something asks for it", async () => {
		const client = await freshClient();

		expect(client).toBeDefined();
		expect(mockLoadStripe).not.toHaveBeenCalled();
	});
});

describe("getStripePromise", () => {
	it("resolves to the Stripe instance", async () => {
		await expect(getStripeClientInstance().getStripePromise()).resolves.toBe(mockStripe);
	});

	it("loads Stripe.js once, however many Elements providers ask for it", async () => {
		const client = await freshClient();

		await client.getStripePromise();
		await client.getStripePromise();

		expect(mockLoadStripe).toHaveBeenCalledExactlyOnceWith("pk_test_123");
	});

	it("hands every caller that asks while the script is loading the same attempt", async () => {
		const client = await freshClient();

		expect(client.getStripePromise()).toBe(client.getStripePromise());
		expect(mockLoadStripe).toHaveBeenCalledOnce();
	});

	it("rejects when the script cannot load, for the caller to answer", async () => {
		mockLoadStripe.mockRejectedValue(new Error("Failed to load Stripe.js"));
		const client = await freshClient();

		await expect(client.getStripePromise()).rejects.toThrow("Failed to load Stripe.js");
	});

	it("forgets a failed load, so asking again loads Stripe.js again", async () => {
		mockLoadStripe.mockRejectedValueOnce(new Error("Failed to load Stripe.js"));
		const client = await freshClient();

		await expect(client.getStripePromise()).rejects.toThrow();
		await expect(client.getStripePromise()).resolves.toBe(mockStripe);

		expect(mockLoadStripe).toHaveBeenCalledTimes(2);
	});

	it("keeps a successful load across later asks after a failure", async () => {
		mockLoadStripe.mockRejectedValueOnce(new Error("Failed to load Stripe.js"));
		const client = await freshClient();
		await expect(client.getStripePromise()).rejects.toThrow();

		await client.getStripePromise();
		await client.getStripePromise();

		expect(mockLoadStripe).toHaveBeenCalledTimes(2);
	});
});
