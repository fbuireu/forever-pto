import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface PdfNodeProps {
	children?: ReactNode;
	style?: Record<string, unknown> | Record<string, unknown>[];
	title?: string;
}

vi.mock("@react-pdf/renderer", async () => {
	const { createElement } = await import("react");
	const node =
		(name: string) =>
		({ children, style, title }: PdfNodeProps) =>
			createElement(
				"div",
				{ "data-pdf": name, "data-style": JSON.stringify(style ?? null), "data-title": title },
				children,
			);

	return {
		Document: node("document"),
		Page: node("page"),
		Text: node("text"),
		View: node("view"),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

const { HolidayDocument } = await import("./HolidayDocument");

const holiday = (isoDate: string, name: string): HolidayDTO => ({
	id: isoDate,
	date: new Date(`${isoDate}T00:00:00`),
	name,
	variant: HolidayVariant.NATIONAL,
	isInPlanningWindow: true,
});

const LABELS = {
	holidays: "Holidays",
	ptoDays: "PTO days",
	ptoDay: "PTO day",
	generatedOn: "Generated on",
};

interface RenderDocumentParams {
	holidays?: HolidayDTO[];
	ptoDays?: Date[];
	includeHolidays?: boolean;
	includePto?: boolean;
}

const renderDocument = ({
	holidays = [],
	ptoDays = [],
	includeHolidays = true,
	includePto = true,
}: RenderDocumentParams = {}) =>
	render(
		<HolidayDocument
			year={2026}
			holidays={holidays}
			ptoDays={ptoDays}
			includeHolidays={includeHolidays}
			includePto={includePto}
			locale="en"
			labels={LABELS}
		/>,
	);

const monthLabels = () =>
	[...document.querySelectorAll('[data-pdf="view"] > [data-pdf="text"]:first-child')]
		.map((node) => node.textContent ?? "")
		.filter((text) => /^[A-Z][a-z]+ \d{4}$/.test(text));

const HOLIDAYS = [
	holiday("2026-03-19", "Sant Josep"),
	holiday("2026-01-06", "Reyes"),
	holiday("2026-01-01", "New Year"),
];

beforeEach(() => {
	vi.useFakeTimers({ toFake: ["Date"] });
	vi.setSystemTime(new Date(2026, 5, 15));
});

afterEach(() => {
	vi.useRealTimers();
});

describe("HolidayDocument", () => {
	it("names itself for the year it covers, since the file is what a reader files away", () => {
		renderDocument({ holidays: HOLIDAYS });

		expect(document.querySelector('[data-pdf="document"]')?.getAttribute("data-title")).toBe("Forever PTO 2026");
		expect(screen.getByText("2026")).toBeTruthy();
	});

	it("groups the Holidays by month and puts the months in order", () => {
		renderDocument({ holidays: HOLIDAYS });

		expect(monthLabels()).toStrictEqual(["January 2026", "March 2026"]);
	});

	it("keeps a month of the following year after the same month of this one", () => {
		renderDocument({
			holidays: [holiday("2027-01-01", "New Year"), holiday("2026-01-01", "New Year")],
		});

		expect(monthLabels()).toStrictEqual(["January 2026", "January 2027"]);
	});

	it("counts every Holiday it was given, not the months it grouped them into", () => {
		renderDocument({ holidays: HOLIDAYS });

		expect(screen.getByText("3")).toBeTruthy();
	});

	it("lists each Holiday with the weekday, which is the point of exporting it", () => {
		renderDocument({ holidays: [holiday("2026-01-06", "Reyes")] });

		expect(screen.getByText("Tue, Jan 6")).toBeTruthy();
		expect(screen.getByText("Reyes")).toBeTruthy();
	});

	it("labels every PTO Day the same way, because a spent day has no name of its own", () => {
		renderDocument({ ptoDays: [new Date(2026, 6, 2), new Date(2026, 6, 3)] });

		expect(screen.getAllByText(LABELS.ptoDay)).toHaveLength(2);
		expect(screen.getByText("2")).toBeTruthy();
	});

	it("leaves the Holidays out when they were not asked for", () => {
		renderDocument({ holidays: HOLIDAYS, ptoDays: [new Date(2026, 6, 2)], includeHolidays: false });

		expect(screen.queryByText(LABELS.holidays)).toBeNull();
		expect(screen.getByText(LABELS.ptoDays)).toBeTruthy();
	});

	it("leaves the PTO Days out when they were not asked for", () => {
		renderDocument({ holidays: HOLIDAYS, ptoDays: [new Date(2026, 6, 2)], includePto: false });

		expect(screen.getByText(LABELS.holidays)).toBeTruthy();
		expect(screen.queryByText(LABELS.ptoDays)).toBeNull();
	});

	it("shows no section at all for a list that is empty rather than an empty heading", () => {
		renderDocument({ holidays: [], ptoDays: [] });

		expect(screen.queryByText(LABELS.holidays)).toBeNull();
		expect(screen.queryByText(LABELS.ptoDays)).toBeNull();
	});

	it("stamps the day it was generated, so a stale copy is recognisable", () => {
		renderDocument({ holidays: HOLIDAYS });

		expect(document.body.textContent).toContain(`${LABELS.generatedOn} June 15, 2026`);
	});

	it("signs every page, whatever was included", () => {
		renderDocument();

		expect(screen.getByText("forever-pto.com")).toBeTruthy();
	});
});
