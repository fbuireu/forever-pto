import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Loader = () => Promise<{ default: unknown }>;

const { dynamic, MockInlineQuickStartForm, view } = vi.hoisted(() => ({
	dynamic: [] as { loader: Loader; options?: { ssr?: boolean; loading?: () => ReactNode } }[],
	MockInlineQuickStartForm: vi.fn().mockReturnValue(null),
	view: { isInView: false },
}));

vi.mock("next/dynamic", () => ({
	default: (loader: Loader, options?: { ssr?: boolean; loading?: () => ReactNode }) => {
		dynamic.push({ loader, options });
		return (props: Record<string, unknown>) => <div data-testid="split" data-props={JSON.stringify(props)} />;
	},
}));
vi.mock("./InlineQuickStartForm", () => ({ InlineQuickStartForm: MockInlineQuickStartForm }));
vi.mock("./InlineQuickStartFixture", () => ({ InlineQuickStartFixture: () => <div data-testid="fixture" /> }));
vi.mock("boneyard-js/react", () => ({
	Skeleton: ({ name, fallback }: { name: string; fallback: ReactNode }) => <div data-bones={name}>{fallback}</div>,
}));
vi.mock("@ui/hooks/useIsInView", () => ({
	useIsInView: () => ({ ref: { current: null }, isInView: view.isInView }),
}));

const { InlineQuickStartClient } = await import("./InlineQuickStartClient");

const renderClient = () => render(<InlineQuickStartClient countries={[]} serverYear={2026} />);

beforeEach(() => {
	view.isInView = false;
	vi.useFakeTimers({ now: new Date(2026, 5, 15), toFake: ["Date"] });
});

afterEach(() => {
	vi.useRealTimers();
});

describe("InlineQuickStartClient", () => {
	it("holds the form's place but loads nothing until it nears the viewport", () => {
		const { container } = renderClient();

		expect(screen.queryByTestId("split")).toBeNull();
		expect(container.firstElementChild?.className).toContain("min-h-");
	});

	it("shows the form's skeleton until it mounts, and while its chunk loads", () => {
		const { container } = renderClient();

		expect(container.querySelector('[data-bones="inline-quick-start"]')).not.toBeNull();
		expect(screen.getByTestId("fixture")).toBeDefined();

		const { container: loading } = render(<>{dynamic[0]?.options?.loading?.()}</>);

		expect(loading.querySelector('[data-bones="inline-quick-start"]')).not.toBeNull();
	});

	it("mounts the form in view, with the visitor's year", () => {
		view.isInView = true;
		vi.useFakeTimers({ now: new Date(2031, 0, 1), toFake: ["Date"] });
		renderClient();

		expect(JSON.parse(screen.getByTestId("split").getAttribute("data-props") ?? "")).toStrictEqual({
			countries: [],
			currentYear: 2031,
		});
	});

	it("splits the form off the page bundle and renders none of it on the server", async () => {
		expect(dynamic.map(({ options }) => options?.ssr)).toStrictEqual([false]);
		expect((await dynamic[0]?.loader())?.default).toBe(MockInlineQuickStartForm);
	});
});
