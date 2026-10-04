import { AMOUNT_MAX, AMOUNT_MIN } from "@application/dto/payment/schema";
import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { DonationForm } from "./DonationForm";

vi.mock("@application/dto/payment/schema", async (importOriginal) => ({
	...(await importOriginal<typeof import("@application/dto/payment/schema")>()),
	AMOUNT_MIN: 3,
	AMOUNT_MAX: 500,
}));

const Harness = ({ isPending }: { isPending: boolean }) => {
	const form = useForm({ defaultValues: { email: "", amount: 10 as number | null, promoCode: "" } });

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
			<output data-testid="amount">{JSON.stringify(form.watch("amount"))}</output>
		</NextIntlClientProvider>
	);
};

const enabledControls = () =>
	screen
		.getAllByRole("textbox")
		.concat(screen.getAllByRole("button"))
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

	it("bounds the amount field with the limits the payment schema enforces, which Home and End go to", async () => {
		const user = userEvent.setup();
		render(<Harness isPending={false} />);
		const amount = screen.getByPlaceholderText(enMessages.donationForm.enterAmount);

		await user.click(amount);
		await user.keyboard("{Home}");
		expect(screen.getByTestId("amount").textContent).toBe(String(AMOUNT_MIN));

		await user.keyboard("{End}");
		expect(screen.getByTestId("amount").textContent).toBe(String(AMOUNT_MAX));
	});

	it("is a text field named by its label, which says in the visitor's language that it holds a number", () => {
		render(<Harness isPending={false} />);
		const amount = screen.getByRole("textbox", { name: enMessages.donationForm.donationAmount });

		expect(amount.getAttribute("type")).toBe("text");
		expect(amount.getAttribute("aria-roledescription")).toBe(enMessages.a11y.numberField);
		expect(amount.getAttribute("inputmode")).toBe("numeric");
	});

	it("keeps the group's left padding on the amount, which no longer sits directly in the group", () => {
		render(<Harness isPending={false} />);

		expect(screen.getByRole("textbox", { name: enMessages.donationForm.donationAmount }).className).toContain("pl-2");
	});

	it("lands the amount label on the input rather than on the group wrapping it", () => {
		render(<Harness isPending={false} />);

		expect(screen.getByLabelText(enMessages.donationForm.donationAmount).tagName).toBe("INPUT");
	});

	it("writes a preset into the form the moment it is clicked", () => {
		render(<Harness isPending={false} />);

		fireEvent.click(screen.getByRole("button", { name: "€15" }));

		expect(screen.getByTestId("amount").textContent).toBe("15");
	});

	it("holds the typed amount as a number, an emptied field as none, for the schema to read when it is used", async () => {
		const user = userEvent.setup();
		render(<Harness isPending={false} />);
		const amount = screen.getByPlaceholderText<HTMLInputElement>(enMessages.donationForm.enterAmount);

		await user.clear(amount);
		await user.type(amount, "25");
		expect(screen.getByTestId("amount").textContent).toBe("25");

		await user.clear(amount);
		expect(screen.getByTestId("amount").textContent).toBe("null");
		expect(amount.value).toBe("");
	});

	it("writes no 0 into the amount field when it is emptied, nor when it is left empty", async () => {
		const user = userEvent.setup();
		render(<Harness isPending={false} />);
		const amount = screen.getByPlaceholderText<HTMLInputElement>(enMessages.donationForm.enterAmount);

		await user.clear(amount);
		await user.tab();

		expect(amount.value).toBe("");
	});

	it("promises no description on a field that has none", () => {
		render(<Harness isPending={false} />);

		expect(
			screen.getByPlaceholderText(enMessages.donationForm.emailPlaceholder).getAttribute("aria-describedby"),
		).toBeNull();
	});
});
