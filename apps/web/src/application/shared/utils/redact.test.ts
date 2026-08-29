import { describe, expect, it } from "vitest";
import { emailDomain } from "./redact";

describe("emailDomain", () => {
	it("keeps the domain and drops the local part, which is the identifying half", () => {
		expect(emailDomain("donor@example.com")).toBe("example.com");
	});

	it("answers undefined for an absent address rather than an empty string", () => {
		expect(emailDomain(null)).toBeUndefined();
		expect(emailDomain(undefined)).toBeUndefined();
	});

	it("answers undefined for a value with no @ at all, so nothing identifying leaks through", () => {
		expect(emailDomain("not-an-address")).toBeUndefined();
	});
});
