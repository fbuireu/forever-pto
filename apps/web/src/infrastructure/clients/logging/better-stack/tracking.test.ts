import { afterEach, describe, expect, it, vi } from "vitest";
import { identifyUser, track, trackingEnvironment } from "./tracking";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("track", () => {
	it("is a no-op when window is undefined (SSR)", () => {
		expect(() => track({ event: "payment_started" })).not.toThrow();
	});

	it("is a no-op when window.betterstack is undefined", () => {
		vi.stubGlobal("window", {});
		expect(() => track({ event: "payment_completed" })).not.toThrow();
	});

	it('calls window.betterstack with "track", the event name and properties', () => {
		const betterstack = vi.fn();
		vi.stubGlobal("window", { betterstack });
		track({ event: "payment_started", properties: { plan: "premium" } });
		expect(betterstack).toHaveBeenCalledWith("track", "payment_started", { plan: "premium" });
	});

	it("calls window.betterstack without properties when omitted", () => {
		const betterstack = vi.fn();
		vi.stubGlobal("window", { betterstack });
		track({ event: "upgrade_modal_opened" });
		expect(betterstack).toHaveBeenCalledWith("track", "upgrade_modal_opened", undefined);
	});

	it("fans the same event out to Google Analytics, under the same name and properties", () => {
		const betterstack = vi.fn();
		const gtag = vi.fn();
		vi.stubGlobal("window", { betterstack, gtag });
		track({ event: "quick_start_opened", properties: { source: "hero" } });
		expect(gtag).toHaveBeenCalledWith("event", "quick_start_opened", { source: "hero" });
		expect(betterstack).toHaveBeenCalledWith("track", "quick_start_opened", { source: "hero" });
	});

	it("still reaches Google Analytics when the Better Stack script is absent, and the other way round", () => {
		const gtag = vi.fn();
		vi.stubGlobal("window", { gtag });
		track({ event: "planner_generated" });
		expect(gtag).toHaveBeenCalledWith("event", "planner_generated", undefined);

		const betterstack = vi.fn();
		vi.stubGlobal("window", { betterstack });
		track({ event: "planner_generated" });
		expect(betterstack).toHaveBeenCalledWith("track", "planner_generated", undefined);
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

	it("hands Google Analytics the plan as a user property and never the email", () => {
		const gtag = vi.fn();
		vi.stubGlobal("window", { gtag });
		identifyUser({ email: "user@example.com", plan: "premium" });
		expect(gtag).toHaveBeenCalledExactlyOnceWith("set", "user_properties", { plan: "premium" });
		expect(JSON.stringify(gtag.mock.calls)).not.toContain("user@example.com");
	});
});

describe("trackingEnvironment", () => {
	it.each(["localhost", "127.0.0.1", "pr-384-forever-pto-development.fbuireu.workers.dev"])(
		"reports %s as development",
		(hostname) => {
			expect(trackingEnvironment(hostname)).toBe("development");
		},
	);

	it.each(["forever-pto.com", "www.forever-pto.com", "workers.dev.example.com"])(
		"reports %s as production",
		(hostname) => {
			expect(trackingEnvironment(hostname)).toBe("production");
		},
	);
});
