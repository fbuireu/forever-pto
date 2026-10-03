import { describe, expect, it } from "vitest";
import {
	ACTIVATION_FAILED,
	ACTIVATION_PARAM,
	amountFromInput,
	createDonationFormSchemaWithMessages,
	createPaymentSchema,
	createPaymentSchemaWithMessages,
	paymentConfirmationQuerySchema,
	promoCodeErrorCodeSchema,
} from "./schema";
import { PromoCodeErrors } from "./types";

const VALID = { amount: 9.99, email: "user@example.com" };

describe("createPaymentSchema", () => {
	describe("valid input", () => {
		it("accepts a valid amount and email without promoCode", () => {
			expect(createPaymentSchema.validate(VALID)).toBe(true);
		});

		it("accepts a valid promoCode when provided", () => {
			expect(createPaymentSchema.validate({ ...VALID, promoCode: "SAVE10" })).toBe(true);
		});

		it("accepts an empty promoCode (optional field)", () => {
			expect(createPaymentSchema.validate({ ...VALID, promoCode: "" })).toBe(true);
		});

		it("accepts minimum valid amount (1)", () => {
			expect(createPaymentSchema.validate({ ...VALID, amount: 1 })).toBe(true);
		});

		it("accepts maximum valid amount (10000)", () => {
			expect(createPaymentSchema.validate({ ...VALID, amount: 10000 })).toBe(true);
		});
	});

	describe("amount validation", () => {
		it("rejects amount below minimum (0)", () => {
			const result = createPaymentSchema.safeParse({ ...VALID, amount: 0 });
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.issues[0]?.message).toBe("amount_too_low");
		});

		it("rejects amount above maximum (10001)", () => {
			const result = createPaymentSchema.safeParse({ ...VALID, amount: 10001 });
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.issues[0]?.message).toBe("amount_too_high");
		});

		it("rejects a non-numeric amount", () => {
			expect(createPaymentSchema.validate({ ...VALID, amount: "ten" })).toBe(false);
		});

		it("rejects a missing amount", () => {
			const { amount: _, ...rest } = VALID;
			expect(createPaymentSchema.validate(rest)).toBe(false);
		});
	});

	describe("email validation", () => {
		it("rejects an invalid email format", () => {
			const result = createPaymentSchema.safeParse({ ...VALID, email: "not-an-email" });
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.issues[0]?.message).toBe("invalid_email");
		});

		it("rejects a missing email", () => {
			const { email: _, ...rest } = VALID;
			expect(createPaymentSchema.validate(rest)).toBe(false);
		});

		it("rejects an email over the 254-character cap", () => {
			const result = createPaymentSchema.safeParse({ ...VALID, email: `${"a".repeat(250)}@example.com` });
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.issues[0]?.message).toBe("invalid_email");
		});
	});

	describe("promoCode validation", () => {
		it("accepts a promoCode of exactly 100 characters", () => {
			expect(createPaymentSchema.validate({ ...VALID, promoCode: "A".repeat(100) })).toBe(true);
		});

		it("rejects a promoCode over the cap with a machine code, never Zod prose", () => {
			const result = createPaymentSchema.safeParse({ ...VALID, promoCode: "A".repeat(101) });
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.issues[0]?.message).toBe("promo_code_too_long");
		});
	});
});

describe("createPaymentSchemaWithMessages", () => {
	const schema = createPaymentSchemaWithMessages({
		amountMin: "Amount too small",
		amountMax: "Amount too big",
		invalidEmail: "Bad email",
		emailRequired: "Email needed",
		promoCodeTooLong: "Promo code too long",
	});

	it("uses the provided amountMin message", () => {
		const result = schema.safeParse({ ...VALID, amount: 0 });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0]?.message).toBe("Amount too small");
	});

	it("uses the provided amountMax message", () => {
		const result = schema.safeParse({ ...VALID, amount: 99999 });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0]?.message).toBe("Amount too big");
	});

	it("uses the provided invalidEmail message", () => {
		const result = schema.safeParse({ ...VALID, email: "bad" });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0]?.message).toBe("Bad email");
	});

	it("uses the provided promoCodeTooLong message", () => {
		const result = schema.safeParse({ ...VALID, promoCode: "A".repeat(101) });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0]?.message).toBe("Promo code too long");
	});
});

describe("createDonationFormSchemaWithMessages", () => {
	const schema = createDonationFormSchemaWithMessages({
		amountMin: "Amount too small",
		amountMax: "Amount too big",
		invalidEmail: "Bad email",
		emailRequired: "Email needed",
		promoCodeTooLong: "Promo code too long",
	});

	it.each([
		["25", 25],
		["4.", 4],
		["12.5", 12.5],
	])("converts the text %j the field holds into %d on submit", (amount, expected) => {
		expect(schema.parse({ ...VALID, amount })).toEqual({ ...VALID, amount: expected });
	});

	it("answers an emptied field with the minimum's own message, never Zod's", () => {
		const result = schema.safeParse({ ...VALID, amount: "" });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues.map(({ message }) => message)).toEqual(["Amount too small"]);
	});

	it("keeps the payment schema's ceiling and its message", () => {
		const result = schema.safeParse({ ...VALID, amount: "99999" });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues.map(({ message }) => message)).toEqual(["Amount too big"]);
	});
});

describe("amountFromInput", () => {
	it.each([
		["", 0],
		["4.", 4],
		["10", 10],
		["2.5", 2.5],
	])("reads %j as %d", (text, expected) => {
		expect(amountFromInput(text)).toBe(expected);
	});
});

describe("promoCodeErrorCodeSchema", () => {
	it("keeps the wire-format codes a refused promo code answers with", () => {
		expect(PromoCodeErrors).toEqual({
			INVALID_OR_EXPIRED: "invalid_or_expired",
			USAGE_LIMIT_REACHED: "usage_limit_reached",
			COUPON_EXPIRED: "coupon_expired",
			COUPON_INVALID: "coupon_invalid",
			FAILED_TO_LOAD: "failed_to_load",
			MIN_AMOUNT_EXCEEDED: "min_amount_exceeded",
		});
	});

	it.each(Object.values(PromoCodeErrors))("accepts %s", (code) => {
		expect(promoCodeErrorCodeSchema.validate(code)).toBe(true);
	});

	it.each([["promo_code_too_long"], ["INVALID_OR_EXPIRED"], [""], [undefined]])("refuses %o", (code) => {
		expect(promoCodeErrorCodeSchema.validate(code)).toBe(false);
	});
});

describe("paymentConfirmationQuerySchema", () => {
	it("reads the activation flag under the parameter the activation route writes", () => {
		expect(ACTIVATION_PARAM).toBe("activation");
		expect(ACTIVATION_FAILED).toBe("failed");
		expect(Object.keys(paymentConfirmationQuerySchema.shape)).toContain(ACTIVATION_PARAM);
	});

	it.each([
		[{ payment_intent: "pi_123" }],
		[{ payment_intent: "pi_123", activation: "failed", redirect_status: "succeeded" }],
		[{}],
	])("accepts %o", (query) => {
		expect(paymentConfirmationQuerySchema.validate(query)).toBe(true);
	});

	it.each([[{ payment_intent: ["pi_123", "pi_456"] }], [{ payment_intent: "pi_123", activation: ["failed"] }]])(
		"rejects a repeated parameter in %o",
		(query) => {
			expect(paymentConfirmationQuerySchema.validate(query)).toBe(false);
		},
	);
});
