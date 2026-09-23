import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ui = vi.hoisted(() => ({ quickStartOpen: false, setQuickStartOpen: vi.fn() }));
const track = vi.hoisted(() => vi.fn());

vi.mock("@application/stores/ui", () => ({
	useUIStore: (selector: (state: typeof ui) => unknown) => selector(ui),
}));
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));
vi.mock("./QuickStartForm", () => ({
	QuickStartForm: ({ currentYear, onStepChange }: { currentYear: number; onStepChange?: (step: string) => void }) => (
		<div data-testid="form" data-year={currentYear}>
			<button type="button" onClick={() => onStepChange?.("ptoDays")}>
				advance
			</button>
		</div>
	),
}));

import { QuickStartDialog } from "./QuickStartDialog";

const renderDialog = () =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<QuickStartDialog countries={[]} currentYear={2026} />
		</NextIntlClientProvider>,
	);

beforeEach(() => {
	ui.quickStartOpen = false;
	ui.setQuickStartOpen.mockClear();
	track.mockClear();
});

describe("QuickStartDialog", () => {
	it("renders nothing while the store says it is closed", () => {
		renderDialog();

		expect(screen.queryByRole("dialog")).toBeNull();
		expect(screen.queryByTestId("form")).toBeNull();
	});

	it("renders the form inside a dialog once the store opens it", () => {
		ui.quickStartOpen = true;
		renderDialog();

		const dialog = screen.getByRole("dialog");

		expect(dialog.contains(screen.getByTestId("form"))).toBe(true);
		expect(screen.getByTestId("form").getAttribute("data-year")).toBe("2026");
	});

	it("names the close button in the reader's language and closes through the store", () => {
		ui.quickStartOpen = true;
		renderDialog();

		fireEvent.click(screen.getByRole("button", { name: enMessages.a11y.closeDialog }));

		expect(ui.setQuickStartOpen).toHaveBeenCalledExactlyOnceWith(false);
	});

	it("reports a close as an abandonment, naming the step that was showing", () => {
		ui.quickStartOpen = true;
		renderDialog();

		fireEvent.click(screen.getByRole("button", { name: "advance" }));
		fireEvent.click(screen.getByRole("button", { name: enMessages.a11y.closeDialog }));

		expect(track).toHaveBeenCalledExactlyOnceWith({ event: "quick_start_abandoned", properties: { step: "ptoDays" } });
	});

	it("reports nothing while the store closes it from the outside, which is what a finish does", () => {
		ui.quickStartOpen = true;
		const { rerender } = renderDialog();
		ui.quickStartOpen = false;
		rerender(
			<NextIntlClientProvider locale="en" messages={enMessages}>
				<QuickStartDialog countries={[]} currentYear={2026} />
			</NextIntlClientProvider>,
		);

		expect(track).not.toHaveBeenCalled();
	});
});
