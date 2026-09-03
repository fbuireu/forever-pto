import { routing } from "@infrastructure/i18n/routing";
import { describe, expect, it, vi } from "vitest";

const createNavigation = vi.hoisted(() =>
	vi.fn(() => ({
		Link: () => null,
		usePathname: () => "/",
		useRouter: () => ({ push: vi.fn() }),
	})),
);

vi.mock("next-intl/navigation", () => ({ createNavigation }));

const navigation = await import("./navigation");

describe("application/i18n/navigation", () => {
	it("builds the helpers from the shared routing, so every link follows the same prefix rule", () => {
		expect(createNavigation).toHaveBeenCalledExactlyOnceWith(routing);
	});

	it("exports the three helpers the UI imports, and nothing that bypasses the routing", () => {
		expect(Object.keys(navigation).sort()).toEqual(["Link", "usePathname", "useRouter"]);
		expect(typeof navigation.Link).toBe("function");
		expect(typeof navigation.usePathname).toBe("function");
		expect(typeof navigation.useRouter).toBe("function");
	});
});
