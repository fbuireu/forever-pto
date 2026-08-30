import { FilterStrategy } from "@domain/calendar/types";
import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ strategy: "balanced" as string, setStrategy: vi.fn() }));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: unknown) => unknown) =>
		selector({ strategy: store.strategy, setStrategy: store.setStrategy }),
}));

vi.mock("@ui/modules/core/animate/base/Popover", () => ({
	Popover: ({ children }: { children?: ReactNode }) => <div data-primitive="popover">{children}</div>,
	PopoverTrigger: ({ children }: { children?: ReactNode }) => <div data-primitive="popover-trigger">{children}</div>,
	PopoverContent: ({ children, ...props }: ComponentProps<"div">) => <div {...props}>{children}</div>,
}));

const { Strategy } = await import("./Strategy");

const renderStrategy = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<Strategy />
		</NextIntlClientProvider>,
	);

const details = () => screen.getByRole("button", { name: new RegExp(en.sidebar.strategy.strategyDetails) });

const panel = (container: HTMLElement) => container.querySelector('[data-slot="collapsible-content"]') as HTMLElement;

beforeEach(() => {
	store.strategy = FilterStrategy.BALANCED;
	store.setStrategy.mockClear();
});

describe("Strategy", () => {
	it("offers every strategy the planner can run", () => {
		renderStrategy();

		expect(screen.getAllByRole("option").map((option) => option.textContent)).toStrictEqual([
			en.sidebar.strategy.grouped.label,
			en.sidebar.strategy.optimized.label,
			en.sidebar.strategy.balanced.label,
		]);
	});

	it("stores the strategy that was picked", async () => {
		renderStrategy();

		await userEvent.click(screen.getByRole("option", { name: en.sidebar.strategy.optimized.label }));

		expect(store.setStrategy).toHaveBeenCalledExactlyOnceWith(FilterStrategy.OPTIMIZED);
	});

	it("says nothing when the same strategy is picked again", async () => {
		renderStrategy();

		await userEvent.click(screen.getByRole("option", { name: en.sidebar.strategy.balanced.label }));

		expect(store.setStrategy).not.toHaveBeenCalled();
	});

	it("describes the strategy the store holds, not the first one in the list", () => {
		renderStrategy();

		expect(screen.getByText(en.sidebar.strategy.balanced.description)).toBeTruthy();
		expect(screen.queryByText(en.sidebar.strategy.grouped.description)).toBeNull();
	});

	it("follows the store to another strategy's description", () => {
		store.strategy = FilterStrategy.GROUPED;

		renderStrategy();

		expect(screen.getByText(en.sidebar.strategy.grouped.description)).toBeTruthy();
	});

	it("lists what the chosen strategy is good and bad at, since that is what the choice costs", () => {
		store.strategy = FilterStrategy.OPTIMIZED;

		renderStrategy();

		expect(screen.getByText(en.sidebar.strategy.optimized.pros.maximumEfficiency)).toBeTruthy();
		expect(screen.getByText(en.sidebar.strategy.optimized.cons.shortBridges)).toBeTruthy();
	});

	it("keeps the details away from a reader who has not asked for them", () => {
		const { container } = renderStrategy();

		expect(details().getAttribute("aria-expanded")).toBe("false");
		expect(panel(container).getAttribute("aria-hidden")).toBe("true");
	});

	it("opens the details, and says so on the control that opened them", async () => {
		const { container } = renderStrategy();

		await userEvent.click(details());

		expect(details().getAttribute("aria-expanded")).toBe("true");
		expect(panel(container).getAttribute("aria-hidden")).toBeNull();
		expect(details().textContent).toContain(en.sidebar.strategy.hide);
	});

	it("closes them again", async () => {
		const { container } = renderStrategy();

		await userEvent.click(details());
		await userEvent.click(details());

		expect(panel(container).getAttribute("aria-hidden")).toBe("true");
		expect(details().textContent).toContain(en.sidebar.strategy.expand);
	});

	it("shows no details at all for a strategy it does not know", () => {
		store.strategy = "does-not-exist";

		const { container } = renderStrategy();

		expect(container.querySelector('[data-slot="collapsible-content"]')).toBeNull();
	});
});
