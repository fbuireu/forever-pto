import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { StepOutcome, StepOutcomeTone } from "./StepOutcome";

const labels = enMessages.formButtons;

const renderOutcome = (props: Partial<ComponentProps<typeof StepOutcome>> = {}) =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<StepOutcome
				tone={StepOutcomeTone.SUCCESS}
				icon={<span data-testid="icon" />}
				title="Message sent"
				description="We will answer soon."
				onClose={vi.fn()}
				{...props}
			/>
		</NextIntlClientProvider>,
	);

describe("StepOutcome", () => {
	it("offers only a close button when there is nothing to retry", () => {
		const onClose = vi.fn();
		renderOutcome({ onClose });

		expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([labels.close]);
		fireEvent.click(screen.getByRole("button", { name: labels.close }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("offers a retry ahead of close when the outcome can be retried", () => {
		const onTryAgain = vi.fn();
		renderOutcome({ tone: StepOutcomeTone.ERROR, onTryAgain });

		expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([labels.tryAgain, labels.close]);
		fireEvent.click(screen.getByRole("button", { name: labels.tryAgain }));
		expect(onTryAgain).toHaveBeenCalledOnce();
	});

	it("shows the title, the description and the icon it was given", () => {
		renderOutcome();

		expect(screen.getByText("Message sent")).toBeDefined();
		expect(screen.getByText("We will answer soon.")).toBeDefined();
		expect(screen.getByTestId("icon")).toBeDefined();
	});

	it("paints the error tone on the badge so the title reads as a failure before the copy does", () => {
		const { container } = renderOutcome({ tone: StepOutcomeTone.ERROR });

		expect(container.querySelector(".bg-destructive")).not.toBeNull();
	});
});
