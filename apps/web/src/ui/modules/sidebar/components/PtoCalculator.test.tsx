import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const filters = vi.hoisted(() => ({ ptoDays: 20, setPtoDays: vi.fn() }));

const holidays = vi.hoisted(() => ({ trimManualDays: vi.fn(), askForPlan: vi.fn() }));

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("@application/stores/filters", () => ({
	MIN_PTO_DAYS: 1,
	useFiltersStore: (selector: (state: unknown) => unknown) => selector(filters),
}));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector(holidays),
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

const BUNDLES: Record<string, typeof en> = {
	en,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface RenderCalculatorParams {
	locale?: Locale;
	messages?: typeof en;
}

const renderCalculator = ({ locale = "en", messages = en }: RenderCalculatorParams = {}) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<PtoCalculator />
		</NextIntlClientProvider>,
	);

interface SetDaysPerMonthParams {
	user: ReturnType<typeof userEvent.setup>;
	value: string;
}

const setDaysPerMonth = async ({ user, value }: SetDaysPerMonthParams) => {
	const input = screen.getByRole("textbox");
	await user.clear(input);
	await user.type(input, value);
};

interface CalculateParams {
	user: ReturnType<typeof userEvent.setup>;
	days: string;
	month: string;
	messages?: typeof en;
}

const calculate = async ({ user, days, month, messages = en }: CalculateParams) => {
	await setDaysPerMonth({ user, value: days });
	await user.selectOptions(screen.getByLabelText("month"), month);
	await user.click(screen.getByRole("button", { name: messages.ptoCalculator.calculate }));
};

const apply = () => screen.getByRole("button", { name: en.ptoCalculator.applyToPtoDays });

const breakdownOf = (container: HTMLElement) =>
	container.querySelector(".bg-muted p")?.textContent?.replace(/\s+/g, " ").trim() ?? "";

beforeEach(() => {
	filters.ptoDays = 20;
	filters.setPtoDays.mockClear();
	holidays.trimManualDays.mockClear();
	holidays.askForPlan.mockClear();
});

describe("PtoCalculator", () => {
	it("offers the twelve months of the year it was given", () => {
		renderCalculator();

		expect(screen.getAllByRole("option")).toHaveLength(12);
		expect(screen.getAllByRole("option")[0]?.textContent).toBe("January");
	});

	it("shows no result, and nothing to apply, until asked to calculate", () => {
		renderCalculator();

		expect(screen.queryByRole("button", { name: en.ptoCalculator.applyToPtoDays })).toBeNull();
	});

	it("redraws the breakdown when a second calculation lands on the same total", async () => {
		const user = userEvent.setup();
		const { container } = renderCalculator();

		await calculate({ user, days: "2", month: "6" });

		expect(breakdownOf(container)).toBe("2 days/month × 6 months");

		await calculate({ user, days: "1", month: "12" });

		expect(breakdownOf(container)).toBe("1 days/month × 12 months");
	});

	it("counts a single month as one, not as months", async () => {
		const user = userEvent.setup();
		const { container } = renderCalculator();

		await calculate({ user, days: "2", month: "1" });

		expect(breakdownOf(container)).toBe("2 days/month × 1 month");
	});

	it.each(Object.entries(BUNDLES))("renders the %s breakdown with both figures in place", async (locale, messages) => {
		const user = userEvent.setup();
		const { container } = renderCalculator({ locale: locale as Locale, messages });

		await calculate({ user, days: "2", month: "6", messages });

		expect(breakdownOf(container)).toMatch(/^2 \S.* × 6 \S+$/);
		expect(breakdownOf(container)).not.toMatch(/[<>{}]|ptoCalculator\./);
	});

	it("applies the rounded total as the new budget and trims the manual picks to it", async () => {
		const user = userEvent.setup();
		renderCalculator();

		await calculate({ user, days: "2.5", month: "5" });
		await user.click(apply());

		expect(filters.setPtoDays).toHaveBeenCalledExactlyOnceWith(13);
		expect(holidays.trimManualDays).toHaveBeenCalledExactlyOnceWith(13);
		expect(holidays.askForPlan).toHaveBeenCalledOnce();
	});

	it("leaves the store alone when the total already is the budget, so nothing is trimmed for no change", async () => {
		const user = userEvent.setup();
		renderCalculator();

		await calculate({ user, days: "2", month: "10" });
		await user.click(apply());

		expect(filters.setPtoDays).not.toHaveBeenCalled();
		expect(holidays.trimManualDays).not.toHaveBeenCalled();
		expect(holidays.askForPlan).not.toHaveBeenCalled();
	});

	it("never applies less than the minimum budget, whatever the accrual came to", async () => {
		const user = userEvent.setup();
		renderCalculator();

		await calculate({ user, days: "0", month: "3" });
		await user.click(apply());

		expect(filters.setPtoDays).toHaveBeenCalledExactlyOnceWith(1);
	});
});

describe("the days-per-month field", () => {
	const field = () => screen.getByRole<HTMLInputElement>("textbox");

	it("stays empty once emptied, instead of turning into 0 under the cursor", async () => {
		const user = userEvent.setup();
		renderCalculator();

		await user.clear(field());

		expect(field().value).toBe("");
	});

	it("counts an emptied field as no days only when asked to calculate", async () => {
		const user = userEvent.setup();
		const { container } = renderCalculator();

		await user.clear(field());
		await user.selectOptions(screen.getByLabelText("month"), "3");
		await user.click(screen.getByRole("button", { name: en.ptoCalculator.calculate }));

		expect(field().value).toBe("");
		expect(breakdownOf(container)).toBe("0 days/month × 3 months");
	});

	it("counts a partial decimal as the number it starts, once asked to calculate", async () => {
		const user = userEvent.setup();
		const { container } = renderCalculator();

		await calculate({ user, days: "4.", month: "2" });

		expect(breakdownOf(container)).toBe("4 days/month × 2 months");
	});

	it("keeps a partial number as typed while the field has focus, instead of rewriting it", async () => {
		const user = userEvent.setup();
		renderCalculator();

		await user.clear(field());
		await user.type(field(), "4.");

		expect(field().value).toBe("4.");
	});

	it("counts what it cannot read as an emptied field, and leaves the field empty once it is left", async () => {
		const user = userEvent.setup();
		const { container } = renderCalculator();

		await calculate({ user, days: ".", month: "3" });

		expect(breakdownOf(container)).toBe("0 days/month × 3 months");
		expect(field().value).toBe("");
	});

	it("does not clamp what is typed past the field's own maximum, as a number input never did", async () => {
		const user = userEvent.setup();
		const { container } = renderCalculator();

		await calculate({ user, days: "10", month: "2" });

		expect(breakdownOf(container)).toBe("10 days/month × 2 months");
	});

	it("says what kind of field it is in the visitor's language, which a text field no longer says by its role", () => {
		renderCalculator();

		expect(field().getAttribute("aria-roledescription")).toBe(en.a11y.numberField);
	});

	it.each(Object.entries(BUNDLES))("names itself in %s with the bundle's own words", (locale, messages) => {
		renderCalculator({ locale: locale as Locale, messages });

		expect(field().getAttribute("aria-roledescription")).toBe(messages.a11y.numberField);
	});

	it("offers the decimal keypad, where a number is typed with a separator", () => {
		renderCalculator();

		expect(field().getAttribute("inputmode")).toBe("decimal");
	});

	it("steps by a tenth with the arrow keys, from where the visitor stopped, down to its minimum", async () => {
		const user = userEvent.setup();
		renderCalculator();

		await user.click(field());
		await user.keyboard("{ArrowUp}");
		expect(field().value).toBe("2.6");

		await user.keyboard("{ArrowDown}{ArrowDown}");
		expect(field().value).toBe("2.4");

		await user.keyboard("{Home}");
		expect(field().value).toBe("0");

		await user.keyboard("{ArrowDown}");
		expect(field().value).toBe("0");
	});

	it("jumps to its maximum with End, and does not step past it", async () => {
		const user = userEvent.setup();
		renderCalculator();

		await user.click(field());
		await user.keyboard("{End}");
		expect(field().value).toBe("8");

		await user.keyboard("{ArrowUp}");
		expect(field().value).toBe("8");
	});
});

describe("the days-per-month field in the visitor's own language", () => {
	const apply = (messages: typeof en) => screen.getByRole("button", { name: messages.ptoCalculator.applyToPtoDays });

	it.each([
		["en", "2.5"],
		["es", "2,5"],
		["ca", "2,5"],
		["it", "2,5"],
		["de", "2,5"],
		["fr", "2,5"],
	])("reads %s %j as two and a half days a month", async (locale, days) => {
		const user = userEvent.setup();
		const messages = BUNDLES[locale] as typeof en;
		const { container } = renderCalculator({ locale: locale as Locale, messages });

		await calculate({ user, days, month: "5", messages });
		await user.click(apply(messages));

		expect(breakdownOf(container)).toMatch(/^2\.5 /);
		expect(filters.setPtoDays).toHaveBeenCalledExactlyOnceWith(13);
	});

	it.each([
		["es", "2.5"],
		["de", "2.5"],
		["en", "2,5"],
	])("reads %s %j, the other language's decimal separator, as two and a half too", async (locale, days) => {
		const user = userEvent.setup();
		const messages = BUNDLES[locale] as typeof en;
		const { container } = renderCalculator({ locale: locale as Locale, messages });

		await calculate({ user, days, month: "5", messages });

		expect(breakdownOf(container)).toMatch(/^2\.5 /);
	});

	it.each([
		["es", "2,5"],
		["de", "2,5"],
		["en", "2.5"],
	])(
		"shows %s %j as the visitor typed it, and as the language writes it once the field is left",
		async (locale, days) => {
			const user = userEvent.setup();
			renderCalculator({ locale: locale as Locale, messages: BUNDLES[locale] as typeof en });

			await setDaysPerMonth({ user, value: days });
			await user.tab();

			expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe(days);
		},
	);

	it("writes the language's own separator when the field is left holding the other one", async () => {
		const user = userEvent.setup();
		renderCalculator({ locale: "es", messages: BUNDLES.es as typeof en });

		await setDaysPerMonth({ user, value: "2.5" });
		await user.tab();

		expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("2,5");
	});

	it("starts at two and a half days in the language's own spelling", () => {
		renderCalculator({ locale: "es", messages: BUNDLES.es as typeof en });

		expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("2,5");
	});
});

describe("PtoCalculator analytics", () => {
	it("reports the tool being used, and an applied result as the new budget", async () => {
		track.mockClear();
		const user = userEvent.setup();
		renderCalculator();

		await calculate({ user, days: "2", month: "12" });
		expect(track).toHaveBeenCalledExactlyOnceWith({ event: "tool_used", properties: { tool: "ptoCalculator" } });

		await user.click(apply());

		expect(track).toHaveBeenLastCalledWith({
			event: "planning_input_changed",
			properties: { input: "ptoDays", inputValue: 24, source: "ptoCalculator" },
		});
	});
});
