import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import en from "@i18n/messages/en.json";
import es from "@i18n/messages/es.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

const { mockToastError, mockToastSuccess, removeHoliday, askForPlan, logClientError } = vi.hoisted(() => ({
	mockToastError: vi.fn(),
	mockToastSuccess: vi.fn(),
	removeHoliday: vi.fn(),
	askForPlan: vi.fn(),
	logClientError: vi.fn(),
}));

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("sonner", () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));

vi.mock("@application/shared/utils/clientLog", () => ({ logClientError }));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector({ removeHoliday, askForPlan }),
}));

const { DeleteHolidayModal } = await import("./DeleteHolidayModal");

interface HolidayParams {
	id: string;
	name: string;
	day: number;
}

const holiday = ({ id, name, day }: HolidayParams): HolidayDTO => ({
	id,
	date: new Date(2026, 5, day),
	name,
	variant: HolidayVariant.CUSTOM,
	isInPlanningWindow: true,
});

const SHUTDOWN = holiday({ id: "1", name: "Company shutdown", day: 3 });
const OFFSITE = holiday({ id: "2", name: "Team offsite", day: 9 });

interface RenderModalParams {
	holidays: HolidayDTO[];
	onClose?: Mock<() => void>;
	locale?: Locale;
	messages?: typeof en;
}

const renderModal = ({ holidays, onClose = vi.fn(), locale = "en", messages = en }: RenderModalParams) => {
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<DeleteHolidayModal open onClose={onClose} locale={locale} holidays={holidays} />
		</NextIntlClientProvider>,
	);
	return onClose;
};

const confirm = () => userEvent.click(screen.getByRole("button", { name: en.modals.deleteHoliday.submit }));

beforeEach(() => {
	mockToastError.mockClear();
	mockToastSuccess.mockClear();
	removeHoliday.mockClear();
	askForPlan.mockClear();
	logClientError.mockClear();
});

describe("DeleteHolidayModal", () => {
	it("names every Holiday it is about to delete, with the date that tells two of a name apart", () => {
		renderModal({ holidays: [SHUTDOWN, OFFSITE] });

		expect(screen.getByText("Company shutdown")).toBeTruthy();
		expect(screen.getByText("Team offsite")).toBeTruthy();
		expect(screen.getByText("Jun 3, 2026")).toBeTruthy();
		expect(screen.getByText("Jun 9, 2026")).toBeTruthy();
	});

	it("asks about one Holiday in the singular", () => {
		renderModal({ holidays: [SHUTDOWN] });

		expect(screen.getByRole("heading", { name: "Delete holiday" })).toBeTruthy();
		expect(document.body.textContent).toContain("Are you sure you want to delete this holiday?");
	});

	it("asks about several in the plural, and says how many", () => {
		renderModal({ holidays: [SHUTDOWN, OFFSITE] });

		expect(screen.getByRole("heading", { name: "Delete holidays" })).toBeTruthy();
		expect(document.body.textContent).toContain("Are you sure you want to delete 2 holidays?");
	});

	it("deletes every Holiday it listed, one call each", async () => {
		renderModal({ holidays: [SHUTDOWN, OFFSITE] });

		await confirm();

		expect(removeHoliday.mock.calls).toStrictEqual([["1"], ["2"]]);
		expect(askForPlan).toHaveBeenCalledOnce();
	});

	it("says so and closes once they are gone", async () => {
		const onClose = renderModal({ holidays: [SHUTDOWN, OFFSITE] });

		await confirm();

		expect(mockToastSuccess).toHaveBeenCalledWith("Holidays deleted", { description: "2 holidays have been removed" });
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("says it in the singular for a single Holiday", async () => {
		renderModal({ holidays: [SHUTDOWN] });

		await confirm();

		expect(mockToastSuccess).toHaveBeenCalledWith("Holiday deleted", { description: "The holiday has been removed" });
	});

	it("reports a failure rather than closing on it, and leaves a record behind", async () => {
		removeHoliday.mockImplementationOnce(() => {
			throw new Error("store refused");
		});
		const onClose = renderModal({ holidays: [SHUTDOWN] });

		await confirm();

		expect(mockToastError).toHaveBeenCalledWith(en.modals.deleteHoliday.errorTitle, {
			description: en.modals.deleteHoliday.errorDescription,
		});
		expect(mockToastSuccess).not.toHaveBeenCalled();
		expect(logClientError).toHaveBeenCalledOnce();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("goes away without deleting anything when the answer is no", async () => {
		const onClose = renderModal({ holidays: [SHUTDOWN] });

		await userEvent.click(screen.getByRole("button", { name: en.modals.deleteHoliday.cancel }));

		expect(removeHoliday).not.toHaveBeenCalled();
		expect(askForPlan).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("asks for no plan when it was handed nothing to delete, since nothing changes", async () => {
		renderModal({ holidays: [] });

		await confirm();

		expect(removeHoliday).not.toHaveBeenCalled();
		expect(askForPlan).not.toHaveBeenCalled();
	});
});

describe("DeleteHolidayModal analytics", () => {
	it("reports how many Custom Holidays went, never which", async () => {
		track.mockClear();
		renderModal({ holidays: [SHUTDOWN, OFFSITE] });

		await confirm();

		expect(track).toHaveBeenCalledExactlyOnceWith({ event: "custom_holiday_deleted", properties: { count: 2 } });
		expect(JSON.stringify(track.mock.calls)).not.toContain("shutdown");
	});
});

describe("DeleteHolidayModal in Spanish", () => {
	it.each([
		[
			1,
			[SHUTDOWN],
			"Eliminar festivo",
			"¿Estás seguro de que quieres eliminar este festivo?",
			"Festivo eliminado",
			"Se ha eliminado el festivo",
		],
		[
			2,
			[SHUTDOWN, OFFSITE],
			"Eliminar festivos",
			"¿Estás seguro de que quieres eliminar 2 festivos?",
			"Festivos eliminados",
			"Se han eliminado 2 festivos",
		],
	] as const)(
		"agrees every sentence with a count of %i",
		async (_, holidays, title, question, toastTitle, toastDescription) => {
			renderModal({ holidays: [...holidays], locale: "es", messages: es });

			expect(screen.getByRole("heading", { name: title })).toBeTruthy();
			expect(document.body.textContent).toContain(question);

			await userEvent.click(screen.getByRole("button", { name: es.modals.deleteHoliday.submit }));

			expect(mockToastSuccess).toHaveBeenCalledWith(toastTitle, { description: toastDescription });
		},
	);
});
