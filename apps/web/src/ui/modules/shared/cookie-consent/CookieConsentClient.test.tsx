import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

type Loader = () => Promise<{ default: unknown }>;

const { dynamic, MockCookieConsent } = vi.hoisted(() => ({
	dynamic: { loader: undefined as Loader | undefined, options: undefined as { ssr?: boolean } | undefined },
	MockCookieConsent: vi.fn().mockReturnValue(null),
}));

vi.mock("next/dynamic", () => ({
	default: (loader: Loader, options: { ssr?: boolean }) => {
		dynamic.loader = loader;
		dynamic.options = options;
		return () => <div data-testid="cookie-consent" />;
	},
}));
vi.mock("@ui/modules/shared/cookie-consent/CookieConsent", () => ({ CookieConsent: MockCookieConsent }));

const { CookieConsentClient } = await import("./CookieConsentClient");

describe("CookieConsentClient", () => {
	it("defers the banner to the client, since consent lives in the browser and cannot be prerendered", () => {
		render(<CookieConsentClient />);

		expect(screen.getByTestId("cookie-consent")).toBeDefined();
		expect(dynamic.options?.ssr).toBe(false);
	});

	it("loads the real banner module behind the split", async () => {
		render(<CookieConsentClient />);

		expect((await dynamic.loader?.())?.default).toBe(MockCookieConsent);
	});
});
