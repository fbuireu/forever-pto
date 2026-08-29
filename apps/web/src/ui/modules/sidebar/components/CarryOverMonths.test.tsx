import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@application/stores/filters", () => ({
	MIN_CARRY_OVER_MONTHS: 0,
	useFiltersStore: (selector: (state: unknown) => unknown) =>
		selector({ carryOverMonths: 1, setCarryOverMonths: vi.fn() }),
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

describe("CarryOverMonths", () => {
	it("names the slider itself, since Base UI renders its root as a div", () => {
		renderField();

		expect(screen.getByRole("slider", { name: en.sidebar.carryOverMonths.title })).toBeTruthy();
	});

	it("renders no label element, because there is no labelable control to point one at", () => {
		const { container } = renderField();

		expect(container.querySelectorAll("label")).toHaveLength(0);
	});
});
