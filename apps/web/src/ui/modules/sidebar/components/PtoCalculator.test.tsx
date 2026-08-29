import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@application/stores/filters", () => ({
	MIN_PTO_DAYS: 1,
	useFiltersStore: (selector: (state: unknown) => unknown) => selector({ ptoDays: 20, setPtoDays: vi.fn() }),
}));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector({ trimManualDays: vi.fn() }),
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

describe("PtoCalculator", () => {
	it("redraws the breakdown when a second calculation lands on the same total", async () => {
		const user = userEvent.setup();
		const { container } = render(<PtoCalculator currentYear={2026} />);
		const calculate = screen.getByRole("button", { name: "calculate" });
		const breakdown = () => container.querySelector(".bg-muted p")?.textContent?.replace(/\s+/g, " ").trim() ?? "";

		await setDaysPerMonth({ user, value: "2" });
		await user.selectOptions(screen.getByLabelText("month"), "6");
		await user.click(calculate);

		expect(breakdown()).toBe("2 daysMonth × 6 months");

		await setDaysPerMonth({ user, value: "1" });
		await user.selectOptions(screen.getByLabelText("month"), "12");
		await user.click(calculate);

		expect(breakdown()).toBe("1 daysMonth × 12 months");
	});
});
