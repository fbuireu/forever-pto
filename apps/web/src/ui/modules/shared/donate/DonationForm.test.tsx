import enMessages from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
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

describe("DonationForm", () => {
	it("leaves every control usable while nothing is in flight", () => {
		render(<Harness isPending={false} />);

		expect(enabledControls().length).toBeGreaterThan(0);
	});

	it("disables the email field with the rest of the form, not on its own clock", () => {
		render(<Harness isPending />);

		expect(screen.getByPlaceholderText(enMessages.donationForm.emailPlaceholder)).toHaveProperty("disabled", true);
	});

	it("leaves only the promo-code disclosure live, which changes nothing that is being charged", () => {
		render(<Harness isPending />);

		expect(enabledControls().map((control) => control.textContent)).toEqual([enMessages.donationForm.havePromoCode]);
	});
});
