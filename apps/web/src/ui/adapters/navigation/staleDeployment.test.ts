import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIsUnrecognized = vi.fn();

vi.mock("next/navigation", () => ({
	unstable_isUnrecognizedActionError: (error: unknown) => mockIsUnrecognized(error),
}));

const { recoverFromStaleDeployment } = await import("./staleDeployment");

describe("recoverFromStaleDeployment", () => {
	const reload = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("location", { reload });
	});

	it("reloads the page when the server no longer knows the action", () => {
		mockIsUnrecognized.mockReturnValue(true);

		expect(recoverFromStaleDeployment(new Error("stale"))).toBe(true);
		expect(reload).toHaveBeenCalledOnce();
	});

	it("leaves every other error to the caller", () => {
		mockIsUnrecognized.mockReturnValue(false);

		expect(recoverFromStaleDeployment(new Error("anything else"))).toBe(false);
		expect(reload).not.toHaveBeenCalled();
	});
});
