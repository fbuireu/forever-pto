import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateIcs, holidaysState } = vi.hoisted(() => ({
	mockGenerateIcs: vi.fn((_params: { holidays: { id: string }[] }) => "BEGIN:VCALENDAR"),
	holidaysState: {
		holidays: [] as { id: string; date: Date; name: string; isInPlanningWindow: boolean }[],
		suggestion: null as { days: Date[] } | null,
		currentSelection: null as { days: Date[] } | null,
		manualDays: [] as Date[],
		removedSuggestedDays: [] as Date[],
	},
}));

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("@application/export/generateIcs", () => ({ generateIcs: mockGenerateIcs }));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: unknown) => unknown) => selector({ year: 2026 }),
}));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector(holidaysState),
}));

vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ children }: { children: ReactNode }) => children,
}));

const { mockToastError, mockToastSuccess, mockToBlob } = vi.hoisted(() => ({
	mockToastError: vi.fn(),
	mockToastSuccess: vi.fn(),
	mockToBlob: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));

vi.mock("@react-pdf/renderer", () => ({ pdf: () => ({ toBlob: mockToBlob }) }));

vi.mock("@ui/modules/export/HolidayDocument", () => ({ HolidayDocument: () => null }));

const { CalendarExport } = await import("./CalendarExport");

const BUNDLES: Record<string, typeof en> = {
	en,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

const copy = en.calendarExport;

interface RenderExportParams {
	locale?: Locale;
	messages?: typeof en;
}

const renderExport = ({ locale = "en", messages = en }: RenderExportParams = {}) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<CalendarExport />
		</NextIntlClientProvider>,
	);

interface MakeHolidayParams {
	id: string;
	date: string;
	isInPlanningWindow: boolean;
}

const makeHoliday = ({ id, date, isInPlanningWindow }: MakeHolidayParams) => ({
	id,
	date: new Date(`${date}T00:00:00`),
	name: `Holiday ${id}`,
	isInPlanningWindow,
});

beforeEach(() => {
	vi.clearAllMocks();
	holidaysState.holidays = [];
	holidaysState.suggestion = null;
	holidaysState.currentSelection = null;
	holidaysState.manualDays = [];
	holidaysState.removedSuggestedDays = [];

	Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:x"), writable: true });
	Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), writable: true });

	mockToBlob.mockResolvedValue(new Blob(["%PDF"], { type: "application/pdf" }));
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("CalendarExport", () => {
	it("exports only the Holidays inside the Planning Window, not the extra year the store keeps for context", async () => {
		holidaysState.holidays = [
			makeHoliday({ id: "in-1", date: "2026-01-01", isInPlanningWindow: true }),
			makeHoliday({ id: "in-2", date: "2026-12-25", isInPlanningWindow: true }),
			makeHoliday({ id: "out-1", date: "2027-01-01", isInPlanningWindow: false }),
			makeHoliday({ id: "out-2", date: "2027-12-25", isInPlanningWindow: false }),
		];

		renderExport();
		await userEvent.click(screen.getByRole("button", { name: copy.download }));

		expect(mockGenerateIcs).toHaveBeenCalled();
		const passed = mockGenerateIcs.mock.lastCall?.[0];
		expect(passed?.holidays.map((h) => h.id)).toEqual(["in-1", "in-2"]);
	});

	it("says whether the file will carry the Holidays, rather than only colouring the button", async () => {
		renderExport();
		const includeHolidays = screen.getByRole("button", { name: copy.includeHolidays });

		expect(includeHolidays.getAttribute("aria-pressed")).toBe("true");

		await userEvent.click(includeHolidays);

		expect(includeHolidays.getAttribute("aria-pressed")).toBe("false");
	});

	it("says the same about the PTO Days", async () => {
		renderExport();
		const includePto = screen.getByRole("button", { name: copy.includePto });

		expect(includePto.getAttribute("aria-pressed")).toBe("true");

		await userEvent.click(includePto);

		expect(includePto.getAttribute("aria-pressed")).toBe("false");
	});

	it("treats a window with no Holidays in it as nothing to export", () => {
		holidaysState.holidays = [makeHoliday({ id: "out-1", date: "2027-01-01", isInPlanningWindow: false })];

		renderExport();

		expect(screen.getByRole("button", { name: copy.download })).toHaveProperty("disabled", true);
	});
});

const downloadPdf = async () => {
	const clicks: HTMLAnchorElement[] = [];
	const created = document.createElement.bind(document);
	const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
		const element = created(tag);
		if (tag === "a") {
			vi.spyOn(element as HTMLAnchorElement, "click").mockImplementation(() => {
				clicks.push(element as HTMLAnchorElement);
			});
		}
		return element;
	});

	try {
		await userEvent.click(screen.getByRole("button", { name: copy.downloadPdf }));
		await waitFor(() =>
			expect(mockToastSuccess.mock.calls.length + mockToastError.mock.calls.length).toBeGreaterThan(0),
		);
	} finally {
		spy.mockRestore();
	}

	return clicks;
};

describe("CalendarExport copy", () => {
	it("counts the Holidays inside the Planning Window in its description, in bold", () => {
		holidaysState.holidays = [
			makeHoliday({ id: "in-1", date: "2026-01-01", isInPlanningWindow: true }),
			makeHoliday({ id: "in-2", date: "2026-12-25", isInPlanningWindow: true }),
			makeHoliday({ id: "out-1", date: "2027-01-01", isInPlanningWindow: false }),
		];

		const { container } = renderExport();
		const count = container.querySelector("p strong");

		expect(count?.textContent).toBe("2");
		expect(count?.parentElement?.textContent).toBe("Download your 2 holidays as a calendar file.");
	});

	it.each(Object.entries(BUNDLES))("renders the %s description with the count in bold", (locale, messages) => {
		holidaysState.holidays = [makeHoliday({ id: "in-1", date: "2026-01-01", isInPlanningWindow: true })];

		const { container } = renderExport({ locale: locale as Locale, messages });
		const count = container.querySelector("p strong");

		expect(count?.textContent).toBe("1");
		expect(count?.parentElement?.textContent).not.toMatch(/[<>{}]|calendarExport\./);
	});
});

describe("CalendarExport keeps the PDF machinery out of the first load", () => {
	it("imports neither Effect nor the PDF module until the download is asked for", () => {
		const source = readFileSync(resolve(process.cwd(), "src/ui/modules/sidebar/components/CalendarExport.tsx"), "utf8");

		expect(source).not.toMatch(/^import .*from "effect"/m);
		expect(source).not.toMatch(/^import .*exportPdf/m);
	});
});

describe("CalendarExport as a PDF", () => {
	beforeEach(() => {
		holidaysState.holidays = [makeHoliday({ id: "in-1", date: "2026-01-01", isInPlanningWindow: true })];
	});

	it("hands the reader a file named for the year it covers", async () => {
		renderExport();

		const clicks = await downloadPdf();

		expect(clicks).toHaveLength(1);
		expect(clicks[0]?.download).toBe("forever-pto-2026.pdf");
		expect(clicks[0]?.href).toContain("blob:x");
	});

	it("says the file is ready", async () => {
		renderExport();

		await downloadPdf();

		await waitFor(() =>
			expect(mockToastSuccess).toHaveBeenCalledWith(copy.pdf.successTitle, {
				description: copy.pdf.successDescription,
			}),
		);
	});

	it("lets go of the object URL once the download has started, which is what the scope is for", async () => {
		renderExport();

		await downloadPdf();

		await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:x"));
	});

	it("lets go of it even when the download itself fails", async () => {
		renderExport();
		vi.spyOn(document.body, "appendChild").mockImplementationOnce(() => {
			throw new Error("detached");
		});

		await downloadPdf();

		await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:x"));
		expect(mockToastError).toHaveBeenCalledWith(copy.pdf.errorTitle, { description: copy.pdf.errorDescription });
	});

	it("reports a render that never produced a file, rather than failing silently", async () => {
		mockToBlob.mockRejectedValue(new Error("no fonts"));
		renderExport();

		await downloadPdf();

		await waitFor(() =>
			expect(mockToastError).toHaveBeenCalledWith(copy.pdf.errorTitle, { description: copy.pdf.errorDescription }),
		);
		expect(mockToastSuccess).not.toHaveBeenCalled();
		expect(URL.createObjectURL).not.toHaveBeenCalled();
	});
});

describe("CalendarExport analytics", () => {
	beforeEach(() => {
		holidaysState.holidays = [makeHoliday({ id: "in-1", date: "2026-01-01", isInPlanningWindow: true })];
	});

	it("reports an ICS export with what it carried", async () => {
		renderExport();

		await userEvent.click(screen.getByRole("button", { name: copy.includePto }));
		await userEvent.click(screen.getByRole("button", { name: copy.download }));

		expect(track).toHaveBeenCalledExactlyOnceWith({
			event: "calendar_exported",
			properties: { format: "ics", includeHolidays: true, includePto: false, outcome: "success" },
		});
	});

	it("reports a PDF export, and whether it failed", async () => {
		renderExport();

		await downloadPdf();
		await waitFor(() =>
			expect(track).toHaveBeenLastCalledWith({
				event: "calendar_exported",
				properties: { format: "pdf", includeHolidays: true, includePto: true, outcome: "success" },
			}),
		);

		mockToBlob.mockRejectedValueOnce(new Error("renderer down"));
		await downloadPdf();
		await waitFor(() =>
			expect(track).toHaveBeenLastCalledWith({
				event: "calendar_exported",
				properties: { format: "pdf", includeHolidays: true, includePto: true, outcome: "error" },
			}),
		);
	});
});
