import { describe, expect, it } from "vitest";
import { ACTIVATION_FAILED, ACTIVATION_PARAM, matchesClientSecret } from "./activation";

const SECRET = ["pi", "3Qabc123", "secret", "XyZ789"].join("_");

describe("matchesClientSecret", () => {
	it("accepts the exact secret", () => {
		expect(matchesClientSecret(SECRET, SECRET)).toBe(true);
	});

	it("rejects a different secret of the same length", () => {
		expect(matchesClientSecret(SECRET, `${SECRET.slice(0, -1)}0`)).toBe(false);
	});

	it("rejects a truncated secret, which a length-blind loop would accept as a prefix", () => {
		expect(matchesClientSecret(SECRET, SECRET.slice(0, 10))).toBe(false);
	});

	it("rejects a secret with extra characters appended", () => {
		expect(matchesClientSecret(SECRET, `${SECRET}extra`)).toBe(false);
	});

	it("rejects the empty string, which shares every prefix", () => {
		expect(matchesClientSecret(SECRET, "")).toBe(false);
	});

	it("rejects when the payment intent has no secret to compare against", () => {
		expect(matchesClientSecret(null, SECRET)).toBe(false);
	});

	it("rejects when both sides are empty rather than treating that as a match", () => {
		expect(matchesClientSecret("", "")).toBe(false);
	});

	it("is case sensitive", () => {
		expect(matchesClientSecret(SECRET, SECRET.toLowerCase())).toBe(false);
	});
});

describe("activation redirect flag", () => {
	it("names the query parameter the confirmation page reads", () => {
		expect(ACTIVATION_PARAM).toBe("activation");
		expect(ACTIVATION_FAILED).toBe("failed");
	});
});
