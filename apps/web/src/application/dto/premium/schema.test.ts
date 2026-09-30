import { describe, expect, it } from "vitest";
import { activationFailureSchema, noPremiumSessionSchema, premiumKeySchema, premiumSessionSchema } from "./schema";

describe("premiumSessionSchema", () => {
	it("accepts the body the activation route answers on success", () => {
		expect(premiumSessionSchema.validate({ success: true, premiumKey: "pi_123", email: "user@example.com" })).toBe(
			true,
		);
	});

	it.each([
		["no premium key", { email: "user@example.com" }],
		["an empty premium key", { premiumKey: "", email: "user@example.com" }],
		["a numeric premium key", { premiumKey: 42, email: "user@example.com" }],
		["no email", { premiumKey: "pi_123" }],
		["a null email", { premiumKey: "pi_123", email: null }],
		["null", null],
		["an array", []],
	])("rejects %s", (_label, body) => {
		expect(premiumSessionSchema.validate(body)).toBe(false);
	});

	it("leaves the data untouched, extra keys included", () => {
		const body = { premiumKey: "pi_123", email: "user@example.com", success: true };
		premiumSessionSchema.validate(body);
		expect(body).toEqual({ premiumKey: "pi_123", email: "user@example.com", success: true });
	});
});

describe("premiumKeySchema", () => {
	it("needs the premium key alone", () => {
		expect(premiumKeySchema.validate({ premiumKey: "pi_123" })).toBe(true);
	});

	it.each([[{}], [{ premiumKey: "" }], [{ premiumKey: 42 }], [null]])("rejects %o", (body) => {
		expect(premiumKeySchema.validate(body)).toBe(false);
	});
});

describe("noPremiumSessionSchema", () => {
	it.each([[{ premiumKey: null, email: null }], [{}], [{ email: "user@example.com" }]])(
		"accepts %o as the absence of a session",
		(body) => {
			expect(noPremiumSessionSchema.validate(body)).toBe(true);
		},
	);

	it.each([[{ premiumKey: "pi_123" }], [{ premiumKey: 42 }], [null], ["no session"]])(
		"does not read %o as the absence of a session",
		(body) => {
			expect(noPremiumSessionSchema.validate(body)).toBe(false);
		},
	);
});

describe("activationFailureSchema", () => {
	it.each([[{ error: "email_required" }], [{}]])("accepts %o", (body) => {
		expect(activationFailureSchema.validate(body)).toBe(true);
	});

	it.each([[{ error: 42 }], [null], ["email_required"]])("rejects %o", (body) => {
		expect(activationFailureSchema.validate(body)).toBe(false);
	});
});
