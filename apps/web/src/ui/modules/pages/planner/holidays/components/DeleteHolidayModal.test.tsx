import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockToastError, mockToastSuccess, removeHoliday, logClientError } = vi.hoisted(() => ({
	mockToastError: vi.fn(),
	mockToastSuccess: vi.fn(),
	removeHoliday: vi.fn(),
	logClientError: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));

vi.mock("@application/shared/utils/clientLog", () => ({ logClientError }));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector({ removeHoliday }),
}));

const { DeleteHolidayModal } = await import("./DeleteHolidayModal");

const holiday = (id: string, name: string, day: number): HolidayDTO => ({
	id,
	date: new Date(2026, 5, day),
	name,
	variant: HolidayVariant.CUSTOM,
	isInPlanningWindow: true,
});

const SHUTDOWN = holiday("1", "Company shutdown", 3);
const OFFSITE = holiday("2", "Team offsite", 9);

const renderModal = (holidays: HolidayDTO[], onClose = vi.fn()) => {
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<DeleteHolidayModal open onClose={onClose} locale="en" holidays={holidays} />
		</NextIntlClientProvider>,
	);
	return onClose;
};

const confirm = () => userEvent.click(screen.getByRole("button", { name: en.modals.deleteHoliday.submit }));

beforeEach(() => {
	mockToastError.mockClear();
	mockToastSuccess.mockClear();
	removeHoliday.mockClear();
	logClientError.mockClear();
});

describe("DeleteHolidayModal", () => {
	it("names every Holiday it is about to delete, with the date that tells two of a name apart", () => {
		renderModal([SHUTDOWN, OFFSITE]);

		expect(screen.getByText("Company shutdown")).toBeTruthy();
		expect(screen.getByText("Team offsite")).toBeTruthy();
		expect(screen.getByText("Jun 3, 2026")).toBeTruthy();
		expect(screen.getByText("Jun 9, 2026")).toBeTruthy();
	});

	it("asks about one Holiday in the singular", () => {
		renderModal([SHUTDOWN]);

		expect(screen.getByRole("heading", { name: en.modals.deleteHoliday.titleSingular })).toBeTruthy();
	});

	it("asks about several in the plural, and says how many", () => {
		renderModal([SHUTDOWN, OFFSITE]);

		expect(screen.getByRole("heading", { name: en.modals.deleteHoliday.title })).toBeTruthy();
		expect(document.body.textContent).toContain(en.modals.deleteHoliday.description.replace("{count}", "2"));
	});

	it("deletes every Holiday it listed, one call each", async () => {
		renderModal([SHUTDOWN, OFFSITE]);

		await confirm();

		expect(removeHoliday.mock.calls).toStrictEqual([["1"], ["2"]]);
	});

	it("says so and closes once they are gone", async () => {
		const onClose = renderModal([SHUTDOWN, OFFSITE]);

		await confirm();

		expect(mockToastSuccess).toHaveBeenCalledWith(en.modals.deleteHoliday.successTitle, {
			description: en.modals.deleteHoliday.successDescription.replace("{count}", "2"),
		});
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("says it in the singular for a single Holiday", async () => {
		renderModal([SHUTDOWN]);

		await confirm();

		expect(mockToastSuccess).toHaveBeenCalledWith(en.modals.deleteHoliday.successTitleSingular, {
			description: en.modals.deleteHoliday.successDescriptionSingular,
		});
	});

	it("reports a failure rather than closing on it, and leaves a record behind", async () => {
		removeHoliday.mockImplementationOnce(() => {
			throw new Error("store refused");
		});
		const onClose = renderModal([SHUTDOWN]);

		await confirm();

		expect(mockToastError).toHaveBeenCalledWith(en.modals.deleteHoliday.errorTitle, {
			description: en.modals.deleteHoliday.errorDescription,
		});
		expect(mockToastSuccess).not.toHaveBeenCalled();
		expect(logClientError).toHaveBeenCalledOnce();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("goes away without deleting anything when the answer is no", async () => {
		const onClose = renderModal([SHUTDOWN]);

		await userEvent.click(screen.getByRole("button", { name: en.modals.deleteHoliday.cancel }));

		expect(removeHoliday).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalledOnce();
	});
});
