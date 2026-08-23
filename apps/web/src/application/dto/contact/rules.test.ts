import { describe, expect, it } from "vitest";
import { CONTACT_COOLDOWN_HOURS, contactCooldownStart, contactSenderKey } from "./rules";

describe("contactSenderKey", () => {
	it("lowercases and trims, so the same address in two shapes is one sender", () => {
		expect(contactSenderKey("  Someone@Example.COM ")).toBe("someone@example.com");
	});

	it("strips a plus alias, which is the bypass a bare lowercase leaves open", () => {
		expect(contactSenderKey("someone+forever-pto@example.com")).toBe("someone@example.com");
	});

	it("strips only the alias in the local part, never a plus in the domain", () => {
		expect(contactSenderKey("someone@ex+ample.com")).toBe("someone@ex+ample.com");
	});

	it("leaves an address with no alias alone", () => {
		expect(contactSenderKey("someone@example.com")).toBe("someone@example.com");
	});
});

describe("contactCooldownStart", () => {
	it("answers the instant the window opens, which is the default hours before now", () => {
		const now = new Date("2026-08-23T12:00:00.000Z");

		expect(contactCooldownStart({ now })).toBe("2026-08-22T12:00:00.000Z");
	});

	it("takes the window from its parameter, so the default is not the only reachable value", () => {
		const now = new Date("2026-08-23T12:00:00.000Z");

		expect(contactCooldownStart({ now, hours: 1 })).toBe("2026-08-23T11:00:00.000Z");
	});

	it("defaults to the exported window, so the constant and the behaviour cannot drift", () => {
		const now = new Date("2026-08-23T12:00:00.000Z");

		expect(contactCooldownStart({ now })).toBe(contactCooldownStart({ now, hours: CONTACT_COOLDOWN_HOURS }));
	});
});
