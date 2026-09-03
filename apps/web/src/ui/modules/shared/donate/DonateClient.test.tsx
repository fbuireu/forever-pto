import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

type Loader = () => Promise<{ default: unknown }>;

const { dynamic, MockDonate } = vi.hoisted(() => ({
	dynamic: { loader: undefined as Loader | undefined, options: undefined as { ssr?: boolean } | undefined },
	MockDonate: vi.fn().mockReturnValue(null),
}));

vi.mock("next/dynamic", () => ({
	default: (loader: Loader, options: { ssr?: boolean }) => {
		dynamic.loader = loader;
		dynamic.options = options;
		return ({ bottomClassName }: { bottomClassName?: string }) => (
			<div data-testid="donate" data-bottom={bottomClassName} />
		);
	},
}));
vi.mock("@ui/modules/shared/donate/Donate", () => ({ Donate: MockDonate }));

const { DonateClient } = await import("./DonateClient");

describe("DonateClient", () => {
	it("defers the popover to the client, since Stripe cannot mount on the server", () => {
		render(<DonateClient />);

		expect(screen.getByTestId("donate")).toBeDefined();
		expect(dynamic.options?.ssr).toBe(false);
	});

	it("passes the caller's bottom offset through to the popover", () => {
		render(<DonateClient bottomClassName="bottom-4" />);

		expect(screen.getByTestId("donate").getAttribute("data-bottom")).toBe("bottom-4");
	});

	it("loads the real popover module behind the split", async () => {
		render(<DonateClient />);

		expect((await dynamic.loader?.())?.default).toBe(MockDonate);
	});
});
