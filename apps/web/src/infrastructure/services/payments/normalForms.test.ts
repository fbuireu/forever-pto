import { describe, expect, it } from "vitest";
import { normalizePromoCode, PAYMENT_CURRENCY } from "./normalForms";

describe("normalizePromoCode", () => {
	it("upper-cases and strips the whitespace a pasted code carries", () => {
		expect(normalizePromoCode("  save20 ")).toBe("SAVE20");
	});

	it("leaves an already normalised code alone, so normalising twice is safe", () => {
		expect(normalizePromoCode(normalizePromoCode(" save20\t"))).toBe("SAVE20");
	});
});

describe("PAYMENT_CURRENCY", () => {
	it("is the lower-case ISO code Stripe expects, because it is compared against Stripe's own field", () => {
		expect(PAYMENT_CURRENCY).toBe(PAYMENT_CURRENCY.toLowerCase());
	});
});
