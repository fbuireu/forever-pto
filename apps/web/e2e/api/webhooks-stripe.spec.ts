import { ApiError } from "@infrastructure/api/errors";
import { expect, test } from "../fixtures";

const URL = "/api/webhooks/stripe";

test.describe("POST /api/webhooks/stripe", () => {
	test("returns 400 when stripe-signature header is missing", async ({ request }) => {
		const response = await request.post(URL, {
			data: {},
			headers: { "Content-Type": "application/json" },
		});
		expect(response.status()).toBe(400);
		const body = await response.json();
		expect(body.error).toBe(ApiError.MISSING_SIGNATURE);
	});

	test("returns 400 when signature is invalid", async ({ request }) => {
		const response = await request.post(URL, {
			data: "{}",
			headers: {
				"Content-Type": "application/json",
				"stripe-signature": "t=invalid,v1=invalidsig",
			},
		});
		expect(response.status()).toBe(400);
		const body = await response.json();
		expect(body.error).toBe(ApiError.INVALID_SIGNATURE);
	});

	test("returns JSON content-type", async ({ request }) => {
		const response = await request.post(URL, {
			data: {},
			headers: { "Content-Type": "application/json" },
		});
		expect(response.headers()["content-type"]).toContain("application/json");
	});
});
