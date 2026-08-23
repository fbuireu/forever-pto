import { afterEach, describe, expect, it, vi } from "vitest";
import { identifyUser, track } from "./tracking";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("track", () => {
	it("is a no-op when window is undefined (SSR)", () => {
		expect(() => track("payment_started")).not.toThrow();
	});

	it("is a no-op when window.betterstack is undefined", () => {
		vi.stubGlobal("window", {});
		expect(() => track("payment_completed")).not.toThrow();
	});

	it('calls window.betterstack with "track", the event name and properties', () => {
		const betterstack = vi.fn();
		vi.stubGlobal("window", { betterstack });
		track("payment_started", { plan: "premium" });
		expect(betterstack).toHaveBeenCalledWith("track", "payment_started", { plan: "premium" });
	});

	it("calls window.betterstack without properties when omitted", () => {
		const betterstack = vi.fn();
		vi.stubGlobal("window", { betterstack });
		track("upgrade_modal_opened");
		expect(betterstack).toHaveBeenCalledWith("track", "upgrade_modal_opened", undefined);
	});
});

describe("identifyUser", () => {
	it("is a no-op when window is undefined (SSR)", () => {
		expect(() => identifyUser({ email: "a@b.com", plan: "premium" })).not.toThrow();
	});

	it("is a no-op when window.betterstack is undefined", () => {
		vi.stubGlobal("window", {});
		expect(() => identifyUser({ email: "a@b.com", plan: "free" })).not.toThrow();
	});

	it('calls window.betterstack with "user", email and plan', () => {
		const betterstack = vi.fn();
		vi.stubGlobal("window", { betterstack });
		identifyUser({ email: "user@example.com", plan: "premium" });
		expect(betterstack).toHaveBeenCalledWith("user", { email: "user@example.com", plan: "premium" });
	});
});
