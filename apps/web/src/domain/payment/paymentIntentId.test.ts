import { describe, expect, it } from "vitest";
import { paymentIntentIdFixture } from "./fixture";
import { isPaymentIntentId } from "./paymentIntentId";

const CLIENT_SECRET_SHAPE = ["pi", "3Mtwf2LkdIwHu7ix", "secret", "abc123"].join("_");

describe("isPaymentIntentId", () => {
	it.each(["pi_3Mtwf2LkdIwHu7ix28a3sd7", "pi_test", "pi_123"])("accepts %s", (value) => {
		expect(isPaymentIntentId(value)).toBe(true);
	});

	it.each([
		["an empty string", ""],
		["the bare prefix", "pi_"],
		["a charge id", "ch_3Mtwf2LkdIwHu7ix28a3sd7"],
		["a client secret, which starts with the intent id it belongs to", CLIENT_SECRET_SHAPE],
		["a prefix in the middle", "xpi_abc"],
		["an upper-case prefix", "PI_abc"],
		["a trailing newline", "pi_abc\n"],
		["a space", "pi_ abc"],
		["a number", 42],
		["null", null],
		["undefined", undefined],
	])("rejects %s", (_label, value) => {
		expect(isPaymentIntentId(value)).toBe(false);
	});
});

describe("paymentIntentIdFixture", () => {
	it("hands back the value a valid id was written as", () => {
		expect(paymentIntentIdFixture("pi_test")).toBe("pi_test");
	});

	it("refuses a value the guard refuses, so a fixture cannot smuggle in a malformed id", () => {
		expect(() => paymentIntentIdFixture(CLIENT_SECRET_SHAPE)).toThrow(TypeError);
	});
});
