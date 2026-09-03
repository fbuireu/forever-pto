import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const filters = vi.hoisted(() => ({ ptoDays: 20, setPtoDays: vi.fn() }));

const holidays = vi.hoisted(() => ({ trimManualDays: vi.fn() }));

vi.mock("@application/stores/filters", () => ({
	MIN_PTO_DAYS: 1,
	useFiltersStore: (selector: (state: unknown) => unknown) => selector(filters),
}));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector(holidays),
}));

vi.mock("next-intl", () => ({
	useLocale: () => "en",
	useTranslations: () => Object.assign((key: string) => key, { rich: (key: string) => key }),
}));

vi.mock("@ui/modules/core/primitives/Combobox", () => ({
	Combobox: ({
		value,
		options,
		onChange,
	}: {
		value: string;
		options: { value: string; label: string }[];
		onChange: (value: string) => void;
	}) => (
		<select aria-label="month" value={value} onChange={(event) => onChange(event.target.value)}>
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	),
}));

vi.mock("@ui/modules/core/animate/text/SlidingNumber", () => ({
	SlidingNumber: ({ number }: { number: number | string }) => <span>{String(number)}</span>,
}));

vi.mock("@ui/modules/core/animate/icons/Icon", () => ({
	AnimateIcon: ({ children }: { children: ReactNode }) => children,
	IconWrapper: () => null,
	useAnimateIconContext: () => ({ controls: undefined }),
	useVariants: () => ({}),
}));

const { PtoCalculator } = await import("./PtoCalculator");

interface SetDaysPerMonthParams {
	user: ReturnType<typeof userEvent.setup>;
	value: string;
}

const setDaysPerMonth = async ({ user, value }: SetDaysPerMonthParams) => {
	const input = screen.getByRole("spinbutton");
	await user.clear(input);
	await user.type(input, value);
};

interface CalculateParams {
	user: ReturnType<typeof userEvent.setup>;
	days: string;
	month: string;
}

const calculate = async ({ user, days, month }: CalculateParams) => {
	await setDaysPerMonth({ user, value: days });
	await user.selectOptions(screen.getByLabelText("month"), month);
	await user.click(screen.getByRole("button", { name: "calculate" }));
};

const apply = () => screen.getByRole("button", { name: "applyToPtoDays" });

beforeEach(() => {
	filters.ptoDays = 20;
	filters.setPtoDays.mockClear();
	holidays.trimManualDays.mockClear();
});

describe("PtoCalculator", () => {
	it("offers the twelve months of the year it was given", () => {
		render(<PtoCalculator currentYear={2026} />);

		expect(screen.getAllByRole("option")).toHaveLength(12);
		expect(screen.getAllByRole("option")[0]?.textContent).toBe("January");
	});

	it("shows no result, and nothing to apply, until asked to calculate", () => {
		render(<PtoCalculator currentYear={2026} />);

		expect(screen.queryByRole("button", { name: "applyToPtoDays" })).toBeNull();
	});

	it("redraws the breakdown when a second calculation lands on the same total", async () => {
		const user = userEvent.setup();
		const { container } = render(<PtoCalculator currentYear={2026} />);
		const breakdown = () => container.querySelector(".bg-muted p")?.textContent?.replace(/\s+/g, " ").trim() ?? "";

		await calculate({ user, days: "2", month: "6" });

		expect(breakdown()).toBe("2 daysMonth × 6 months");

		await calculate({ user, days: "1", month: "12" });

		expect(breakdown()).toBe("1 daysMonth × 12 months");
	});

	it("applies the rounded total as the new budget and trims the manual picks to it", async () => {
		const user = userEvent.setup();
		render(<PtoCalculator currentYear={2026} />);

		await calculate({ user, days: "2.5", month: "5" });
		await user.click(apply());

		expect(filters.setPtoDays).toHaveBeenCalledExactlyOnceWith(13);
		expect(holidays.trimManualDays).toHaveBeenCalledExactlyOnceWith(13);
	});

	it("leaves the store alone when the total already is the budget, so nothing is trimmed for no change", async () => {
		const user = userEvent.setup();
		render(<PtoCalculator currentYear={2026} />);

		await calculate({ user, days: "2", month: "10" });
		await user.click(apply());

		expect(filters.setPtoDays).not.toHaveBeenCalled();
		expect(holidays.trimManualDays).not.toHaveBeenCalled();
	});

	it("never applies less than the minimum budget, whatever the accrual came to", async () => {
		const user = userEvent.setup();
		render(<PtoCalculator currentYear={2026} />);

		await calculate({ user, days: "0", month: "3" });
		await user.click(apply());

		expect(filters.setPtoDays).toHaveBeenCalledExactlyOnceWith(1);
	});
});
