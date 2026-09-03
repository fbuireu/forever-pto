import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import { render } from "@testing-library/react";
import type { Locale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { locationState, premiumState, loaders } = vi.hoisted(() => ({
	locationState: {
		countries: [] as { value: string; label: string; flag: string }[],
		regions: [] as { value: string; label: string }[],
	},
	premiumState: { premiumKey: "key" as string | null },
	loaders: [] as (() => Promise<{ default: unknown }>)[],
}));

const JAN = (day: number) => new Date(2025, 0, day);

const filtersState = {
	ptoDays: 3,
	country: "ES",
	region: "",
	strategy: "grouped",
	year: 2025,
	carryOverMonths: 0,
};

const holidaysState = {
	suggestion: null as unknown,
	holidays: [] as unknown[],
	alternatives: [] as unknown[],
	currentSelection: null as unknown,
	manuallySelectedDays: [] as Date[],
	removedSuggestedDays: [] as Date[],
};

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
vi.mock("@ui/modules/core/animate/text/SlidingNumber", () => ({
	SlidingNumber: ({ number }: { number: string | number }) => <span>{number}</span>,
}));
vi.mock("@ui/modules/core/animate/text/Rotating", () => ({ RotatingText: () => null }));

import { Summary } from "./Summary";

const METRICS = {
	longWeekends: 0,
	restBlocks: 0,
	maxWorkStreak: 0,
	firstLastBreak: null,
	averageEfficiency: 2.5,
	bonusDays: 0,
	quarterDist: [0, 0, 0, 0],
	bridgesUsed: 0,
	monthlyDist: new Array(12).fill(0),
	longBlocksPerQuarter: [0, 0, 0, 0],
	totalEffectiveDays: 5,
	workedDaysPerMonth: 20,
};

interface RenderSummaryParams {
	locale?: Locale;
	messages?: object;
}

const renderSummary = ({ locale = "en", messages = enMessages }: RenderSummaryParams = {}) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<Summary />
		</NextIntlClientProvider>,
	);

describe("Summary efficiency hint", () => {
	it("names the days the metrics were measured against, not the days the engine first placed", () => {
		holidaysState.suggestion = { days: [JAN(6), JAN(7), JAN(8)], bridges: [], strategy: "grouped", metrics: METRICS };
		holidaysState.currentSelection = null;
		holidaysState.manuallySelectedDays = [];
		holidaysState.removedSuggestedDays = [JAN(7)];

		const { container } = renderSummary();

		expect(container.textContent).toContain("per day spent (2)");
		expect(container.textContent).not.toContain("per day spent (3)");
	});

	it("counts a hand-picked day the engine never placed", () => {
		holidaysState.suggestion = { days: [JAN(6), JAN(7), JAN(8)], bridges: [], strategy: "grouped", metrics: METRICS };
		holidaysState.currentSelection = null;
		holidaysState.manuallySelectedDays = [JAN(20)];
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
		holidaysState.manuallySelectedDays = [];
		holidaysState.removedSuggestedDays = [];
	};

	it("says one day, not one days, in Spanish", () => {
		singleDayPlan();

		const { container } = renderSummary({ locale: "es", messages: esMessages });

		expect(container.textContent).toContain("presupuesto de 1 día");
		expect(container.textContent).not.toContain("presupuesto de 1 días");

		filtersState.ptoDays = 3;
	});

	it("says one Tag, not one Tagen, in German", () => {
		singleDayPlan();

		const { container } = renderSummary({ locale: "de", messages: deMessages });

		expect(container.textContent).toContain("Budget von 1 Tag");
		expect(container.textContent).not.toContain("Budget von 1 Tagen");

		filtersState.ptoDays = 3;
	});
});

describe("Summary manual-adjustment banner", () => {
	const adjustedPlan = ({ added, removed }: { added: Date[]; removed: Date[] }) => {
		filtersState.ptoDays = 5;
		holidaysState.suggestion = { days: [JAN(6), JAN(7), JAN(8)], bridges: [], strategy: "grouped", metrics: METRICS };
		holidaysState.currentSelection = null;
		holidaysState.manuallySelectedDays = added;
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

		filtersState.ptoDays = 3;
	});
});

const planOf = (days: Date[], totalEffectiveDays = 5) => ({
	days,
	bridges: [],
	strategy: "grouped",
	metrics: { ...METRICS, totalEffectiveDays },
});

const resetPlan = () => {
	filtersState.ptoDays = 3;
	holidaysState.suggestion = planOf([JAN(6), JAN(7), JAN(8)]);
	holidaysState.currentSelection = null;
	holidaysState.alternatives = [];
	holidaysState.manuallySelectedDays = [];
	holidaysState.removedSuggestedDays = [];
	holidaysState.holidays = [];
};

describe("the banner that says a better plan exists", () => {
	it("stays quiet when no Alternative beats the applied plan", () => {
		resetPlan();
		holidaysState.alternatives = [planOf([JAN(6)], 4), planOf([JAN(7)], 5)];

		const { container } = renderSummary();

		expect(container.textContent).not.toContain(enMessages.summary.notifications.canImprove.title);
	});

	it("says how many days the best Alternative would add, not how many Alternatives there are", () => {
		resetPlan();
		holidaysState.alternatives = [planOf([JAN(6)], 6), planOf([JAN(7)], 8), planOf([JAN(8)], 7)];

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.summary.notifications.canImprove.title);
		expect(container.textContent).toContain("3 more days");
	});

	it("reads in the singular when the best Alternative adds one day", () => {
		resetPlan();
		holidaysState.alternatives = [planOf([JAN(6)], 6)];

		const { container } = renderSummary();

		expect(container.textContent).toContain("1 more day");
		expect(container.textContent).not.toContain("1 more days");
	});

	it("ignores an Alternative carrying no metrics rather than counting it as nought", () => {
		resetPlan();
		holidaysState.alternatives = [null, planOf([JAN(6)], 7)];

		const { container } = renderSummary();

		expect(container.textContent).toContain("2 more days");
	});
});

describe("the banner about Custom Holidays", () => {
	const custom = (day: number, isInPlanningWindow = true) => ({
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
		holidaysState.holidays = [custom(10), custom(11)];

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.summary.notifications.customHolidays.title);
		expect(container.textContent).toContain("2 custom holidays");
	});

	it("reads in the singular for one, and leaves out the ones outside the window", () => {
		resetPlan();
		holidaysState.holidays = [custom(10), custom(11, false)];

		const { container } = renderSummary();

		expect(container.textContent).toContain("1 custom holiday");
		expect(container.textContent).not.toContain("1 custom holidays");
	});
});

const holidayOf = (variant: string, day: number, isInPlanningWindow = true) => ({
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
			await expect(loader()).resolves.toEqual({ default: expect.any(Function) });
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

	const restore = () => {
		locationState.countries = [];
		locationState.regions = [];
		filtersState.country = "ES";
		filtersState.region = "";
	};

	it("names the country and the region it was planned for, flag first, matching them without regard to case", () => {
		spain();
		filtersState.region = "CT";
		holidaysState.holidays = [holidayOf("regional", 10)];

		const { container } = renderSummary();

		expect(container.querySelector(".fi-es")).not.toBeNull();
		expect(container.textContent).toContain("Spain");
		expect(container.textContent).toContain("Catalonia");
		expect(container.textContent).toContain("1 of your holidays are specific to Catalonia.");
		expect(container.textContent).not.toContain(enMessages.summary.summaryParagraph.noRegionHintTitle);

		restore();
	});

	it("nudges the reader to pick a region while none is set, and names no region it does not have", () => {
		spain();

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.summary.summaryParagraph.noRegionHintTitle);
		expect(container.textContent).not.toContain("Catalonia");

		restore();
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

		filtersState.carryOverMonths = 0;
	});
});

describe("Summary holiday badge", () => {
	it("breaks the count down by Variant, naming only the Variants that have any", () => {
		resetPlan();
		holidaysState.holidays = [
			holidayOf("national", 1),
			holidayOf("national", 6),
			holidayOf("regional", 10),
			holidayOf("custom", 20),
		];

		const { container } = renderSummary();

		expect(container.textContent).toContain("2 nat. + 1 reg. + 1 cust.");
	});

	it("names the national count alone when that is all there is", () => {
		resetPlan();
		holidaysState.holidays = [holidayOf("national", 1)];

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
			...planOf([JAN(6), JAN(7), JAN(8)]),
			metrics: { ...METRICS, firstLastBreak: { first: "Jan 6", last: "Dec 24" }, maxWorkStreak: 45, bonusDays: 3 },
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
		holidaysState.alternatives = [planOf([JAN(6)], 7)];

		const { container } = renderSummary();

		expect(container.textContent).toContain(enMessages.summary.notifications.canImprove.considerPremium);
		expect(container.textContent).not.toContain(enMessages.summary.notifications.canImprove.reviewOptions);

		premiumState.premiumKey = "key";
	});
});
