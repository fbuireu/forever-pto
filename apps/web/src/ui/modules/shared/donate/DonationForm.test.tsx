import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { DonationForm } from "./DonationForm";

const Harness = ({ isPending }: { isPending: boolean }) => {
	const form = useForm({ defaultValues: { email: "", amount: 10, promoCode: "" } });

	return (
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<DonationForm
				form={form as never}
				onSubmit={vi.fn()}
				currentAmount={10}
				locale="en"
				currency="EUR"
				currencySymbol="€"
				isPending={isPending}
			/>
		</NextIntlClientProvider>
	);
};

const enabledControls = () =>
	screen
		.getAllByRole("textbox")
		.concat(screen.getAllByRole("spinbutton"), screen.getAllByRole("button"))
		.filter((control) => !control.hasAttribute("disabled"));

const PRESET_LABELS = ["€5", "€10", "€15"];

const chargingControls = () => [
	screen.getByPlaceholderText(enMessages.donationForm.emailPlaceholder),
	screen.getByPlaceholderText(enMessages.donationForm.enterAmount),
	...PRESET_LABELS.map((label) => screen.getByRole("button", { name: label })),
	screen.getByRole("button", { name: enMessages.donationForm.continueToPayment }),
];

describe("DonationForm", () => {
	it("leaves every control usable while nothing is in flight", () => {
		render(<Harness isPending={false} />);

		expect(chargingControls().map((control) => control.hasAttribute("disabled"))).toEqual([
			false,
			false,
			false,
			false,
			false,
			false,
		]);
	});

	it("disables the email field with the rest of the form, not on its own clock", () => {
		render(<Harness isPending />);

		expect(screen.getByPlaceholderText(enMessages.donationForm.emailPlaceholder)).toHaveProperty("disabled", true);
	});

	it("leaves only the promo-code disclosure live, which changes nothing that is being charged", () => {
		render(<Harness isPending />);

		expect(enabledControls().map((control) => control.textContent)).toEqual([enMessages.donationForm.havePromoCode]);
	});

	it("says which preset is charging, not only which one is coloured", () => {
		render(<Harness isPending={false} />);

		expect(
			PRESET_LABELS.map((label) => screen.getByRole("button", { name: label }).getAttribute("aria-pressed")),
		).toEqual(["false", "true", "false"]);
	});

	it("names the promo-code field, so a half-typed code is still identifiable", () => {
		render(<Harness isPending={false} />);
		fireEvent.click(screen.getByRole("button", { name: enMessages.donationForm.havePromoCode }));

		expect(screen.getByLabelText(enMessages.donationForm.promoCode)).toBeDefined();
	});

	it("declares the two fields the schema refuses to submit without", () => {
		render(<Harness isPending={false} />);

		expect(
			screen.getByPlaceholderText(enMessages.donationForm.emailPlaceholder).getAttribute("required"),
		).not.toBeNull();
		expect(screen.getByPlaceholderText(enMessages.donationForm.enterAmount).getAttribute("required")).not.toBeNull();
	});

	it("points the amount field's description at the note that is actually on the page", () => {
		render(<Harness isPending={false} />);
		const amount = screen.getByPlaceholderText(enMessages.donationForm.enterAmount);
		const describedBy = amount.getAttribute("aria-describedby");

		expect(describedBy).not.toBeNull();
		for (const id of (describedBy as string).split(" ")) {
			expect(document.getElementById(id)).not.toBeNull();
		}
	});

	it("lands the amount label on the input rather than on the group wrapping it", () => {
		render(<Harness isPending={false} />);

		expect(screen.getByLabelText(enMessages.donationForm.donationAmount).tagName).toBe("INPUT");
	});

	it("promises no description on a field that has none", () => {
		render(<Harness isPending={false} />);

		expect(
			screen.getByPlaceholderText(enMessages.donationForm.emailPlaceholder).getAttribute("aria-describedby"),
		).toBeNull();
	});
});
