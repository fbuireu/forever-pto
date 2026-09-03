import en from "@i18n/messages/en.json";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ carryOverMonths: 1, setCarryOverMonths: vi.fn() }));

vi.mock("@application/stores/filters", () => ({
	MIN_CARRY_OVER_MONTHS: 0,
	useFiltersStore: (selector: (state: unknown) => unknown) => selector(store),
}));

vi.mock("@domain/calendar/window", () => ({ MAX_CARRY_OVER_MONTHS: 6 }));

vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ children }: { children: ReactNode }) => children,
}));

const { CarryOverMonths } = await import("./CarryOverMonths");

const renderField = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<CarryOverMonths />
		</NextIntlClientProvider>,
	);

const slider = () => screen.getByRole("slider", { name: en.sidebar.carryOverMonths.title });

const nudgeUp = () => fireEvent.keyDown(slider(), { key: "ArrowRight" });

beforeEach(() => {
	store.carryOverMonths = 1;
	store.setCarryOverMonths.mockClear();
});

describe("CarryOverMonths", () => {
	it("names the slider itself, since Base UI renders its root as a div", () => {
		renderField();

		expect(slider()).toBeTruthy();
	});

	it("renders no label element, because there is no labelable control to point one at", () => {
		const { container } = renderField();

		expect(container.querySelectorAll("label")).toHaveLength(0);
	});

	it("starts on the value the store holds", () => {
		store.carryOverMonths = 3;

		renderField();

		expect(slider().getAttribute("aria-valuenow")).toBe("3");
	});

	it("follows the store when something else writes it, rather than keeping a stale local copy", () => {
		const { rerender } = renderField();
		expect(slider().getAttribute("aria-valuenow")).toBe("1");

		store.carryOverMonths = 4;
		rerender(
			<NextIntlClientProvider locale="en" messages={en}>
				<CarryOverMonths />
			</NextIntlClientProvider>,
		);

		expect(slider().getAttribute("aria-valuenow")).toBe("4");
	});
});

describe("CarryOverMonths debounce", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("moves the readout at once, before the store has heard anything", () => {
		renderField();

		nudgeUp();

		expect(slider().getAttribute("aria-valuenow")).toBe("2");
		expect(store.setCarryOverMonths).not.toHaveBeenCalled();
	});

	it("writes the store once the slider has rested for the debounce", () => {
		renderField();
		nudgeUp();

		act(() => {
			vi.advanceTimersByTime(299);
		});
		expect(store.setCarryOverMonths).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(store.setCarryOverMonths).toHaveBeenCalledExactlyOnceWith(2);
	});

	it("writes only the last value of a quick run of changes, so the plan is not recomputed per notch", () => {
		renderField();

		nudgeUp();
		act(() => {
			vi.advanceTimersByTime(100);
		});
		nudgeUp();
		act(() => {
			vi.advanceTimersByTime(100);
		});
		nudgeUp();
		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(store.setCarryOverMonths).toHaveBeenCalledExactlyOnceWith(4);
	});

	it("drops a pending write when it unmounts, rather than writing into a store nobody is watching", () => {
		const { unmount } = renderField();
		nudgeUp();

		unmount();
		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(store.setCarryOverMonths).not.toHaveBeenCalled();
	});
});
