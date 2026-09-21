import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Loader = () => Promise<{ default: unknown }>;

const { dynamic, MockQuickStartDialog, MockPremiumModal, ui } = vi.hoisted(() => ({
	dynamic: [] as { loader: Loader; options?: { ssr?: boolean } }[],
	MockQuickStartDialog: vi.fn().mockReturnValue(null),
	MockPremiumModal: vi.fn().mockReturnValue(null),
	ui: { quickStartOpen: false, listeners: new Set<() => void>() },
}));

vi.mock("next/dynamic", () => ({
	default: (loader: Loader, options?: { ssr?: boolean }) => {
		dynamic.push({ loader, options });
		const index = dynamic.length;
		return (props: Record<string, unknown>) => (
			<div data-testid={`split-${index}`} data-props={JSON.stringify(props)} />
		);
	},
}));
vi.mock("./QuickStartDialog", () => ({ QuickStartDialog: MockQuickStartDialog }));
vi.mock("@ui/modules/premium/PremiumModal", () => ({ PremiumModal: MockPremiumModal }));
vi.mock("@application/stores/ui", async () => {
	const { useSyncExternalStore } = await import("react");
	const subscribe = (listener: () => void) => {
		ui.listeners.add(listener);
		return () => ui.listeners.delete(listener);
	};
	return {
		useUIStore: (selector: (state: { quickStartOpen: boolean }) => unknown) =>
			useSyncExternalStore(subscribe, () => selector({ quickStartOpen: ui.quickStartOpen })),
	};
});

const { QuickStartClient } = await import("./QuickStartClient");

const setOpen = (open: boolean) => {
	act(() => {
		ui.quickStartOpen = open;
		for (const listener of ui.listeners) listener();
	});
};

const renderClient = () => render(<QuickStartClient countries={[]} currentYear={2026} />);

beforeEach(() => {
	ui.quickStartOpen = false;
	ui.listeners.clear();
});

describe("QuickStartClient", () => {
	it("renders nothing, and so loads nothing, until the quick start is opened", () => {
		const { container } = renderClient();

		expect(container.innerHTML).toBe("");
	});

	it("mounts the dialog and the Premium modal on the first open, with the props the server resolved", () => {
		renderClient();
		setOpen(true);

		expect(JSON.parse(screen.getByTestId("split-1").getAttribute("data-props") ?? "")).toStrictEqual({
			countries: [],
			currentYear: 2026,
		});
		expect(screen.getByTestId("split-2")).toBeDefined();
	});

	it("keeps both mounted once opened, so closing animates and reopening fetches nothing", () => {
		renderClient();
		setOpen(true);
		setOpen(false);

		expect(screen.getByTestId("split-1")).toBeDefined();
		expect(screen.getByTestId("split-2")).toBeDefined();
	});

	it("splits both off the page bundle and renders neither on the server", async () => {
		expect(dynamic.map(({ options }) => options?.ssr)).toStrictEqual([false, false]);
		expect((await dynamic[0]?.loader())?.default).toBe(MockQuickStartDialog);
		expect((await dynamic[1]?.loader())?.default).toBe(MockPremiumModal);
	});
});
