import { holidaysKeyOf } from "@application/stores/types";
import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render } from "@testing-library/react";
import type { Locale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { locationState, premiumState, loaders } = vi.hoisted(() => ({
	locationState: {
		countries: [] as { value: string; label: string; flag: string }[],
		regions: [] as { value: string; label: string }[],
	},
	premiumState: { premiumKey: "key" as string | null },
	loaders: [] as (() => Promise<{ default: unknown }>)[],
}));

const JAN = (day: number) => new Date(2025, 0, day);

const initialFilters = () => ({
	ptoDays: 3,
	country: "ES",
	region: "",
	strategy: "grouped",
	year: 2025,
	carryOverMonths: 0,
});

const initialHolidays = () => ({
	suggestion: null as unknown,
	holidays: [] as unknown[],
	alternatives: [] as unknown[],
	currentSelection: null as unknown,
	manualDays: [] as Date[],
	removedSuggestedDays: [] as Date[],
	planKey: undefined as string | null | undefined,
});

const filtersState = initialFilters();

const holidaysState = initialHolidays();

beforeEach(() => {
	Object.assign(filtersState, initialFilters());
	Object.assign(holidaysState, initialHolidays());
	locationState.countries = [];
	locationState.regions = [];
	premiumState.premiumKey = "key";
});

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: typeof filtersState) => unknown) => selector(filtersState),
}));
vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: typeof holidaysState) => unknown) => selector(holidaysState),
}));
vi.mock("@application/stores/location", () => ({
	useLocationStore: (selector: (state: typeof locationState) => unknown) => selector(locationState),
}));
vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
	PremiumFeatureId: { ADVANCED_METRICS: "advancedMetrics", YEAR_SUMMARY: "yearSummary" },
	PremiumOrigin: { PLANNER: "planner" },
}));
vi.mock("@ui/hooks/useStoresReady", () => ({ useStoresReady: () => ({ areStoresReady: true }) }));
vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock("next/dynamic", () => ({
	default: (loader: () => Promise<{ default: unknown }>) => {
		loaders.push(loader);
		return () => null;
	},
}));
vi.mock("boneyard-js/react", () => ({ Skeleton: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@ui/modules/core/animate/text/SlidingNumber", async () => {
	const { useLocale } = await import("next-intl");

	return {
		SlidingNumber: ({ number, decimalPlaces = 0 }: { number: string | number; decimalPlaces?: number }) => (
			<span>
				{new Intl.NumberFormat(useLocale(), {
					minimumFractionDigits: decimalPlaces,
					maximumFractionDigits: decimalPlaces,
				}).format(Math.abs(Number(number)))}
			</span>
		),
	};
});
vi.mock("@ui/modules/core/animate/text/Rotating", () => ({ RotatingText: () => null }));

import { Summary } from "./Summary";

const METRICS = {
	longWeekends: 0,
	restBlocks: 0,
	maxWorkStreak: 0,
	firstLastRestBlock: null,
	averageEfficiency: 2.5,
	bonusDays: 0,
	quarterDist: [0, 0, 0, 0],
	bridgesUsed: 0,
	monthlyDist: new Array(12).fill(0),
	longBlocksPerQuarter: [0, 0, 0, 0],
	totalEffectiveDays: 5,
	workedDaysPerMonth: 20,
	longestVacation: 16,
};

interface RenderSummaryParams {
	locale?: Locale;
	messages?: object;
}

const renderSummary = ({ locale = "en", messages = enMessages }: RenderSummaryParams = {}) => {
	if (holidaysState.planKey === undefined) {
		holidaysState.planKey = holidaysKeyOf({
			...filtersState,
			carryOverMonths: filtersState.carryOverMonths ?? 0,
			locale,
		});
	}

	return render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<Summary />
		</NextIntlClientProvider>,
	);
};

describe("Summary efficiency hint", () => {
	it("names the days the metrics were measured against, not the days the engine first placed", () => {
		holidaysState.suggestion = { days: [JAN(6), JAN(7), JAN(8)], bridges: [], strategy: "grouped", metrics: METRICS };
		holidaysState.currentSelection = null;
		holidaysState.manualDays = [];
		holidaysState.removedSuggestedDays = [JAN(7)];

		const { container } = renderSummary();

		expect(container.textContent).toContain("per day spent (2)");
		expect(container.textContent).not.toContain("per day spent (3)");
	});

	it("counts a hand-picked day the engine never placed", () => {
		holidaysState.suggestion = { days: [JAN(6), JAN(7), JAN(8)], bridges: [], strategy: "grouped", metrics: METRICS };
		holidaysState.currentSelection = null;
		holidaysState.manualDays = [JAN(20)];
		holidaysState.removedSuggestedDays = [];

		const { container } = renderSummary();

		expect(container.textContent).toContain("per day spent (4)");
	});
});

describe("Summary budget badges at a budget of one", () => {
	const singleDayPlan = () => {
		filtersState.ptoDays = 1;
		holidaysState.suggestion = { days: [JAN(6)], bridges: [], strategy: "grouped", metrics: METRICS };
		holidaysState.currentSelection = null;
		holidaysState.manualDays = [];
		holidaysState.removedSuggestedDays = [];
	};

	it("says one day, not one days, in Spanish", () => {
		singleDayPlan();

		const { container } = renderSummary({ locale: "es", messages: esMessages });

		expect(container.textContent).toContain("presupuesto de 1 día");
		expect(container.textContent).not.toContain("presupuesto de 1 días");
	});

	it("says one Tag, not one Tagen, in German", () => {
		singleDayPlan();

		const { container } = renderSummary({ locale: "de", messages: deMessages });

		expect(container.textContent).toContain("Budget von 1 Tag");
		expect(container.textContent).not.toContain("Budget von 1 Tagen");
	});
});

describe("Summary manual-adjustment banner", () => {
	const adjustedPlan = ({ added, removed }: { added: Date[]; removed: Date[] }) => {
		filtersState.ptoDays = 5;
		holidaysState.suggestion = { days: [JAN(6), JAN(7), JAN(8)], bridges: [], strategy: "grouped", metrics: METRICS };
		holidaysState.currentSelection = null;
		holidaysState.manualDays = added;
		holidaysState.removedSuggestedDays = removed;
	};

	it("says one day, not one days, when a single day was added", () => {
		adjustedPlan({ added: [JAN(20)], removed: [] });

		const { container } = renderSummary();

		expect(container.textContent).toContain("You added 1 day to the original suggestion.");
	});

	it("pluralises the removed side on its own count", () => {
		adjustedPlan({ added: [], removed: [JAN(6), JAN(7)] });

		const { container } = renderSummary();

		expect(container.textContent).toContain("You removed 2 days from the original suggestion.");
	});

	it("lets German put the verb at the end of each half, which fragments could not", () => {
		adjustedPlan({ added: [JAN(20)], removed: [JAN(6), JAN(7)] });

		const { container } = renderSummary({ locale: "de", messages: deMessages });

		expect(container.textContent).toContain(
			"Du hast 1 Tag hinzugefügt und 2 Tage aus dem ursprünglichen Vorschlag entfernt.",
		);
	});
});

interface PlanOfParams {
	days: Date[];
	totalEffectiveDays?: number;
}

const planOf = ({ days, totalEffectiveDays = 5 }: PlanOfParams) => ({
	days,
	bridges: [],
	strategy: "grouped",
	metrics: { ...METRICS, totalEffectiveDays },
});

const resetPlan = () => {
	filtersState.ptoDays = 3;
	holidaysState.suggestion = planOf({ days: [JAN(6), JAN(7), JAN(8)] });
	holidaysState.currentSelection = null;
	holidaysState.alternatives = [];
	holidaysState.manualDays = [];
	holidaysState.removedSuggestedDays = [];
	holidaysState.holidays = [];
};

describe("the banner that says a better plan exists", () => {
	it("stays quiet when no Alternative beats the applied plan", () => {
		resetPlan();
		holidaysState.alternatives = [
			planOf({ days: [JAN(6)], totalEffectiveDays: 4 }),
			planOf({ days: [JAN(7)], totalEffectiveDays: 5 }),
		];

		const { container } = renderSummary();

		expect(container.textContent).not.toContain(enMessages.summary.notifications.canImprove.title);
	});

	it("says how many days the best Alternative would add, not how many Alternatives there are", () => {
		resetPlan();
		holidaysState.alternatives = [
			planOf({ days: [JAN(6)], totalEffectiveDays: 6 }),
			planOf({ days: [JAN(7)], totalEffectiveDays: 8 }),
			planOf({ days: [JAN(8)], totalEffectiveDays: 7 }),
		];

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.summary.notifications.canImprove.title);
		expect(container.textContent).toContain("3 more days");
	});

	it("reads in the singular when the best Alternative adds one day", () => {
		resetPlan();
		holidaysState.alternatives = [planOf({ days: [JAN(6)], totalEffectiveDays: 6 })];

		const { container } = renderSummary();

		expect(container.textContent).toContain("1 more day");
		expect(container.textContent).not.toContain("1 more days");
	});

	it("compares only with the Alternatives the chosen Strategy found, not with another Strategy's plan", () => {
		resetPlan();
		holidaysState.alternatives = [
			{ ...planOf({ days: [JAN(6)], totalEffectiveDays: 9 }), strategy: "optimized" },
			planOf({ days: [JAN(7)], totalEffectiveDays: 6 }),
		];

		const { container } = renderSummary();

		expect(container.textContent).toContain("1 more day");
		expect(container.textContent).not.toContain("4 more days");
	});

	it("names the Strategy that found the plan on screen, not only the one chosen in the sidebar", () => {
		resetPlan();
		holidaysState.currentSelection = { ...planOf({ days: [JAN(6)], totalEffectiveDays: 9 }), strategy: "optimized" };

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.sidebar.strategy.optimized.label);
	});

	it("ignores an Alternative carrying no metrics rather than counting it as nought", () => {
		resetPlan();
		holidaysState.alternatives = [null, planOf({ days: [JAN(6)], totalEffectiveDays: 7 })];

		const { container } = renderSummary();

		expect(container.textContent).toContain("2 more days");
	});
});

describe("the banner about Custom Holidays", () => {
	interface CustomParams {
		day: number;
		isInPlanningWindow?: boolean;
	}

	const custom = ({ day, isInPlanningWindow = true }: CustomParams) => ({
		id: `c-${day}`,
		date: JAN(day),
		name: "Company shutdown",
		variant: "custom",
		isInPlanningWindow,
	});

	it("stays quiet when the reader has added none", () => {
		resetPlan();

		const { container } = renderSummary();

		expect(container.textContent).not.toContain(enMessages.summary.notifications.customHolidays.title);
	});

	it("counts the ones inside the Planning Window", () => {
		resetPlan();
		holidaysState.holidays = [custom({ day: 10 }), custom({ day: 11 })];

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.summary.notifications.customHolidays.title);
		expect(container.textContent).toContain("2 custom holidays");
	});

	it("reads in the singular for one, and leaves out the ones outside the window", () => {
		resetPlan();
		holidaysState.holidays = [custom({ day: 10 }), custom({ day: 11, isInPlanningWindow: false })];

		const { container } = renderSummary();

		expect(container.textContent).toContain("1 custom holiday");
		expect(container.textContent).not.toContain("1 custom holidays");
	});
});

interface HolidayOfParams {
	variant: string;
	day: number;
	isInPlanningWindow?: boolean;
}

const holidayOf = ({ variant, day, isInPlanningWindow = true }: HolidayOfParams) => ({
	id: `${variant}-${day}`,
	date: JAN(day),
	name: `Holiday ${day}`,
	variant,
	isInPlanningWindow,
});

describe("Summary loads its five charts lazily", () => {
	it("resolves each one to the export it names, so a renamed chart fails here rather than on the page", async () => {
		expect(loaders).toHaveLength(5);

		for (const loader of loaders) {
			await expect(loader()).resolves.toEqual({ default: expect.anything() });
		}
	});

	it("resolves each one to a memoised chart, so a calculation starting does not redraw them", async () => {
		for (const loader of loaders) {
			const { default: chart } = (await loader()) as { default: { $$typeof?: symbol } };
			expect(chart.$$typeof).toBe(Symbol.for("react.memo"));
		}
	});
});

describe("Summary heading", () => {
	const spain = () => {
		resetPlan();
		locationState.countries = [{ value: "es", label: "Spain", flag: "es" }];
		locationState.regions = [{ value: "ct", label: "Catalonia" }];
		filtersState.country = "ES";
	};

	it("names the country and the region it was planned for, flag first, matching them without regard to case", () => {
		spain();
		filtersState.region = "CT";
		holidaysState.holidays = [holidayOf({ variant: "regional", day: 10 })];

		const { container } = renderSummary();

		expect(container.querySelector(".fi-es")).not.toBeNull();
		expect(container.textContent).toContain("Spain");
		expect(container.textContent).toContain("Catalonia");
		expect(container.textContent).toContain("1 of your holidays is specific to Catalonia.");
		expect(container.textContent).not.toContain(enMessages.summary.summaryParagraph.noRegionHintTitle);
	});

	it("nudges the reader to pick a region while none is set, and names no region it does not have", () => {
		spain();

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.summary.summaryParagraph.noRegionHintTitle);
		expect(container.textContent).not.toContain("Catalonia");
	});
});

describe("Summary against a plan made for other filters", () => {
	const spanishPlan = () => {
		resetPlan();
		locationState.countries = [
			{ value: "es", label: "Spain", flag: "es" },
			{ value: "fr", label: "France", flag: "fr" },
		];
		holidaysState.planKey = holidaysKeyOf({ country: "ES", region: "", year: 2025, carryOverMonths: 0, locale: "en" });
	};

	it("holds back the previous country's numbers until the new country's plan lands", () => {
		spanishPlan();
		filtersState.country = "FR";

		const { container } = renderSummary();

		expect(container.textContent).not.toContain(enMessages.summary.metrics.effectiveDays);
		expect(container.textContent).not.toContain("France");
	});

	it("shows the plan once it was made for the country on screen", () => {
		spanishPlan();

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.summary.metrics.effectiveDays);
		expect(container.textContent).toContain("Spain");
	});

	it("holds back a plan stored before plans named their filters", () => {
		resetPlan();
		holidaysState.planKey = null;

		const { container } = renderSummary();

		expect(container.textContent).not.toContain(enMessages.summary.metrics.effectiveDays);
	});
});

describe("Summary before there is a plan", () => {
	it("renders nothing to summarise, leaving the skeleton to hold the place", () => {
		resetPlan();
		holidaysState.suggestion = null;

		const { container } = renderSummary();

		expect(container.textContent).not.toContain(enMessages.summary.metrics.effectiveDays);
	});

	it("copes with a store that has not filled in carry-over or alternatives yet", () => {
		resetPlan();
		(filtersState as { carryOverMonths?: number }).carryOverMonths = undefined;
		holidaysState.alternatives = null as never;

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.summary.metrics.effectiveDays);
		expect(container.textContent).not.toContain(enMessages.summary.notifications.canImprove.title);
	});
});

describe("Summary holiday badge", () => {
	it("breaks the count down by Variant, naming only the Variants that have any", () => {
		resetPlan();
		holidaysState.holidays = [
			holidayOf({ variant: "national", day: 1 }),
			holidayOf({ variant: "national", day: 6 }),
			holidayOf({ variant: "regional", day: 10 }),
			holidayOf({ variant: "custom", day: 20 }),
		];

		const { container } = renderSummary();

		expect(container.textContent).toContain("2 nat. + 1 reg. + 1 cust.");
	});

	it("names the national count alone when that is all there is", () => {
		resetPlan();
		holidaysState.holidays = [holidayOf({ variant: "national", day: 1 })];

		const { container } = renderSummary();

		expect(container.textContent).toContain("1 nat.");
		expect(container.textContent).not.toContain("reg.");
		expect(container.textContent).not.toContain("cust.");
	});
});

describe("Summary year summary", () => {
	it("appears once the engine has found a first and a last break, with the streak between them", () => {
		resetPlan();
		holidaysState.suggestion = {
			...planOf({ days: [JAN(6), JAN(7), JAN(8)] }),
			metrics: { ...METRICS, firstLastRestBlock: { first: "Jan 6", last: "Dec 24" }, maxWorkStreak: 45, bonusDays: 3 },
		};

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.summary.yearSummary.title);
		expect(container.textContent).toContain(`${enMessages.summary.yearSummary.maxWorkStreak}45 days`);
		expect(container.textContent).toContain("+3");
	});

	it("stays away while the engine has no breaks to report", () => {
		resetPlan();

		const { container } = renderSummary();

		expect(container.textContent).not.toContain(enMessages.summary.yearSummary.title);
	});
});

describe("the banner that says a better plan exists, for a reader without Premium", () => {
	it("offers Premium rather than the Alternatives it cannot show", () => {
		resetPlan();
		premiumState.premiumKey = null;
		holidaysState.alternatives = [planOf({ days: [JAN(6)], totalEffectiveDays: 7 })];

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.summary.notifications.canImprove.considerPremium);
		expect(container.textContent).not.toContain(enMessages.summary.notifications.canImprove.reviewOptions);
	});
});

describe("Summary Gain sentence", () => {
	const NARROW_SPACES = /[\u00A0\u202F]/g;

	it.each([
		["en", enMessages, "+67% gain"],
		["de", deMessages, "+67 % gegenüber"],
		["es", esMessages, "+67 % respecto"],
	] as const)("writes the %s Gain in the locale's own percent format", (locale, messages, expected) => {
		filtersState.ptoDays = 3;
		holidaysState.suggestion = { days: [JAN(6), JAN(7), JAN(8)], bridges: [], strategy: "grouped", metrics: METRICS };
		holidaysState.currentSelection = null;
		holidaysState.manualDays = [];
		holidaysState.removedSuggestedDays = [];

		const { container } = renderSummary({ locale, messages });

		expect((container.textContent ?? "").replace(NARROW_SPACES, " ")).toContain(expected);
	});
});

describe("Summary numbers carry the glyphs their own bundle gives them", () => {
	const LOCALES = [
		["en", enMessages],
		["es", esMessages],
		["ca", caMessages],
		["it", itMessages],
		["de", deMessages],
		["fr", frMessages],
	] as const;

	const gainPlan = () => {
		filtersState.ptoDays = 3;
		holidaysState.suggestion = {
			days: [JAN(6), JAN(7), JAN(8)],
			bridges: [],
			strategy: "grouped",
			metrics: { ...METRICS, firstLastRestBlock: { first: "Jan 6", last: "Dec 24" }, bonusDays: 3 },
		};
		holidaysState.currentSelection = null;
		holidaysState.manualDays = [];
		holidaysState.removedSuggestedDays = [];
	};

	it.each(LOCALES)("%s writes the Gain card with the percent sign its own typography wants", (locale, messages) => {
		gainPlan();

		const { container } = renderSummary({ locale, messages });

		expect(container.textContent).toContain(
			`${messages.summary.metrics.gain}${new Intl.NumberFormat(locale, { style: "percent" }).format(0.67)}`,
		);
	});

	it.each(LOCALES)("%s rounds the Gain card with the counter and never by hand", (locale, messages) => {
		gainPlan();

		const { container } = renderSummary({ locale, messages });

		expect(container.textContent).not.toContain("66.67");
		expect(container.textContent).not.toContain("66,67");
	});

	it("takes the percent sign of the Gain card from the bundle, so a translator owns it", () => {
		gainPlan();
		const messages = {
			...enMessages,
			summary: {
				...enMessages.summary,
				metrics: { ...enMessages.summary.metrics, gainValue: "<n>{gain}</n> per cent" },
			},
		};

		const { container } = renderSummary({ messages });

		expect(container.textContent).toContain(`${messages.summary.metrics.gain}67 per cent`);
		expect(container.textContent).not.toContain(`${messages.summary.metrics.gain}67%`);
	});

	it("takes the plus before the Bonus Days from the bundle, so a translator owns it", () => {
		gainPlan();
		const messages = {
			...enMessages,
			summary: {
				...enMessages.summary,
				yearSummary: { ...enMessages.summary.yearSummary, bonusDaysCount: "<n>{count}</n> extra" },
			},
		};

		const { container } = renderSummary({ messages });

		expect(container.textContent).toContain("3 extra");
		expect(container.textContent).not.toContain("+3");
	});

	it.each(LOCALES)("%s writes the Bonus Days with a plus inside one message", (locale, messages) => {
		gainPlan();

		const { container } = renderSummary({ locale, messages });

		expect(container.textContent).toContain("+3");
		expect(container.textContent).not.toMatch(/[<>{}]|summary\./);
	});
});

describe("Summary sentences at the plural edges", () => {
	const onePlan = () => {
		resetPlan();
		filtersState.ptoDays = 1;
		holidaysState.suggestion = planOf({ days: [JAN(6)], totalEffectiveDays: 1 });
		holidaysState.holidays = [holidayOf({ variant: "national", day: 1 })];
	};

	it.each([
		["en", enMessages, "With your 1 PTO day and 1 public holiday, you get 1 effective day using the Grouped strategy."],
		["es", esMessages, "Con 1 día de PTO y 1 festivo, obtienes 1 día efectivo usando la estrategia Agrupada."],
	] as const)("says one of each in the %s singular", (locale, messages, expected) => {
		onePlan();

		const { container } = renderSummary({ locale, messages });

		expect(container.textContent).toContain(expected);
	});

	it.each([
		[
			"en",
			enMessages,
			"With your 3 PTO days and 0 public holidays, the Grouped strategy turns them into 5 effective days, that’s 2 days over your budget",
		],
		[
			"es",
			esMessages,
			"Con tus 3 días de PTO y 0 festivos, la estrategia Agrupada los convierte en 5 días efectivos, es decir, 2 días por encima de tu presupuesto",
		],
	] as const)(
		"counts nought and many in the %s plural, and calls the result Effective Days",
		(locale, messages, expected) => {
			resetPlan();

			const { container } = renderSummary({ locale, messages });

			expect(container.textContent).toContain(expected);
			expect(container.querySelector('[data-slot="card-description"] p')?.textContent).not.toMatch(
				/days off|días libres/,
			);
		},
	);

	it.each([
		["en", 1, "1 of your holidays is specific to Catalonia.", enMessages],
		["en", 2, "2 of your holidays are specific to Catalonia.", enMessages],
		["es", 1, "1 de tus festivos es específico de Catalonia.", esMessages],
		["es", 2, "2 de tus festivos son específicos de Catalonia.", esMessages],
	] as const)("agrees the %s Region sentence with %i Regional Holidays", (locale, count, expected, messages) => {
		resetPlan();
		locationState.regions = [{ value: "ct", label: "Catalonia" }];
		filtersState.region = "CT";
		holidaysState.holidays = Array.from({ length: count }, (_, index) =>
			holidayOf({ variant: "regional", day: 10 + index }),
		);

		const { container } = renderSummary({ locale, messages });

		expect(container.textContent).toContain(expected);
	});

	it.each([
		["en", 16, "16 days", enMessages],
		["en", 1, "1 day", enMessages],
		["es", 16, "16 días", esMessages],
		["es", 1, "1 día", esMessages],
	] as const)(
		"writes the %s Longest Vacation of %i with its unit in one message",
		(locale, longestVacation, expected, messages) => {
			resetPlan();
			holidaysState.suggestion = { ...planOf({ days: [JAN(6)] }), metrics: { ...METRICS, longestVacation } };

			const { container } = renderSummary({ locale, messages });
			const label = Array.from(container.querySelectorAll("div")).find(
				(node) => node.textContent === messages.summary.metrics.longestVacation,
			);

			expect(label?.previousElementSibling?.textContent).toBe(expected);
			expect(label?.previousElementSibling?.className).toContain("gap-1");
		},
	);
});

describe("Summary Effective Days badge", () => {
	it("puts the days over budget inside the sentence that names the budget", () => {
		resetPlan();

		const { container } = renderSummary();

		expect(container.textContent).toContain("+2 over your 3-day budget");
	});

	it("reads nought, not a negative number, when the plan returns less than the budget", () => {
		resetPlan();
		holidaysState.suggestion = planOf({ days: [JAN(6), JAN(7), JAN(8)], totalEffectiveDays: 2 });

		const { container } = renderSummary();

		expect(container.textContent).toContain("0 over your 3-day budget");
		expect(container.textContent).not.toContain("-1");
	});
});

describe("Summary rich-text messages in every bundle", () => {
	it.each(
		Object.entries({ en: enMessages, es: esMessages, ca: caMessages, it: itMessages, de: deMessages, fr: frMessages }),
	)("renders the %s day counts whole, with no raw tag, brace or key", (locale, messages) => {
		resetPlan();
		holidaysState.suggestion = {
			...planOf({ days: [JAN(6), JAN(7), JAN(8)] }),
			metrics: {
				...METRICS,
				firstLastRestBlock: { first: "Jan 6", last: "Dec 24" },
				maxWorkStreak: 45,
				longestVacation: 16,
			},
		};

		const { container } = renderSummary({ locale: locale as Locale, messages });
		const text = container.textContent ?? "";

		expect(text).toMatch(/45\s\p{L}+/u);
		expect(text).toMatch(/16\s\p{L}+/u);
		expect(text).not.toMatch(/[<>{}]|summary\.|charts\./);
	});
});
