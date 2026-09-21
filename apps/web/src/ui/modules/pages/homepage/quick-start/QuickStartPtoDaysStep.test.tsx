import { MAX_PTO_DAYS, MIN_PTO_DAYS } from "@application/stores/filters";
import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { QuickStartPtoDaysStep } from "./QuickStartPtoDaysStep";

const ptoDaysMessages = enMessages.ptoDays;

interface RenderStepParams {
	ptoDays?: number;
	year?: number;
}

const renderStep = ({ ptoDays = 22, year = 2026 }: RenderStepParams = {}) => {
	const onChange = vi.fn();

	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<QuickStartPtoDaysStep currentYear={2026} draft={{ ptoDays, year }} onChange={onChange} />
		</NextIntlClientProvider>,
	);

	return onChange;
};

describe("QuickStartPtoDaysStep", () => {
	it("steps the budget up and down by one", () => {
		const onChange = renderStep();

		fireEvent.click(screen.getByRole("button", { name: ptoDaysMessages.increase }));
		fireEvent.click(screen.getByRole("button", { name: ptoDaysMessages.decrease }));

		expect(onChange).toHaveBeenNthCalledWith(1, { ptoDays: 23 });
		expect(onChange).toHaveBeenNthCalledWith(2, { ptoDays: 21 });
	});

	it("disables the step that would leave the allowed range", () => {
		renderStep({ ptoDays: MIN_PTO_DAYS });
		expect((screen.getByRole("button", { name: ptoDaysMessages.decrease }) as HTMLButtonElement).disabled).toBe(true);
		expect((screen.getByRole("button", { name: ptoDaysMessages.increase }) as HTMLButtonElement).disabled).toBe(false);
	});

	it("clamps at the ceiling rather than passing a budget the store would refuse", () => {
		const onChange = renderStep({ ptoDays: MAX_PTO_DAYS });

		expect((screen.getByRole("button", { name: ptoDaysMessages.increase }) as HTMLButtonElement).disabled).toBe(true);
		fireEvent.click(screen.getByRole("button", { name: ptoDaysMessages.decrease }));
		expect(onChange).toHaveBeenCalledExactlyOnceWith({ ptoDays: MAX_PTO_DAYS - 1 });
	});

	it("offers last year, this year and the two after, with the draft's year checked", () => {
		renderStep({ year: 2027 });

		expect(screen.getAllByRole("radio").map((radio) => (radio as HTMLInputElement).value)).toStrictEqual([
			"2025",
			"2026",
			"2027",
			"2028",
		]);
		expect((screen.getByLabelText("2027") as HTMLInputElement).checked).toBe(true);
		expect((screen.getByLabelText("2026") as HTMLInputElement).checked).toBe(false);
	});

	it("hands back the year that was picked", () => {
		const onChange = renderStep();

		fireEvent.click(screen.getByLabelText("2028"));

		expect(onChange).toHaveBeenCalledExactlyOnceWith({ year: 2028 });
	});
});
