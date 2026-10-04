import {
	amountFromField,
	type CreatePaymentInput,
	createDonationFormSchemaWithMessages,
	type DonationFormValues,
} from "@application/dto/payment/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DonationForm } from "./DonationForm";

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

const AMOUNT_TOO_LOW = "the amount is below the minimum";
const AMOUNT_TOO_HIGH = "the amount is above the maximum";

const onSubmit = vi.fn<(data: CreatePaymentInput) => void>();

interface HarnessProps {
	locale: string;
}

const Harness = ({ locale }: HarnessProps) => {
	const schema = createDonationFormSchemaWithMessages({
		amountMin: AMOUNT_TOO_LOW,
		amountMax: AMOUNT_TOO_HIGH,
		invalidEmail: "bad email",
		emailRequired: "email needed",
		promoCodeTooLong: "promo code too long",
	});
	const form = useForm<DonationFormValues, unknown, CreatePaymentInput>({
		resolver: zodResolver(schema),
		defaultValues: { email: "someone@example.test", amount: 5, promoCode: "" },
	});

	return (
		<NextIntlClientProvider locale={locale as Locale} messages={BUNDLES[locale] as typeof enMessages}>
			<DonationForm
				form={form}
				onSubmit={onSubmit}
				currentAmount={amountFromField(form.watch("amount"))}
				locale={locale as Locale}
				currency="EUR"
				currencySymbol="€"
				isPending={false}
			/>
		</NextIntlClientProvider>
	);
};

const open = (locale: string) => {
	render(<Harness locale={locale} />);

	return screen.getByRole<HTMLInputElement>("textbox", {
		name: (BUNDLES[locale] as typeof enMessages).donationForm.donationAmount,
	});
};

const typeAmount = async ({ amount, text }: { amount: HTMLInputElement; text: string }) => {
	const user = userEvent.setup();
	await user.clear(amount);
	if (text !== "") await user.type(amount, text);

	return user;
};

interface SubmitParams {
	locale: string;
	user: ReturnType<typeof userEvent.setup>;
}

const submit = async ({ locale, user }: SubmitParams) => {
	await user.click(
		screen.getByRole("button", { name: (BUNDLES[locale] as typeof enMessages).donationForm.continueToPayment }),
	);
};

const preset = (euros: number) => screen.getByRole("button", { name: new RegExp(`^${euros}\\s?€$`) });

const donated = () => onSubmit.mock.calls.map(([data]) => data.amount);

beforeEach(() => {
	onSubmit.mockClear();
});

describe("the Donation amount in the visitor's own language", () => {
	it.each([
		["en", "2.5"],
		["es", "2,5"],
		["ca", "2,5"],
		["it", "2,5"],
		["de", "2,5"],
		["fr", "2,5"],
	])("reads %s %j as two and a half", async (locale, text) => {
		const amount = open(locale);
		const user = await typeAmount({ amount, text });

		await submit({ locale, user });

		await waitFor(() => expect(donated()).toEqual([2.5]));
	});

	it.each([
		["en", "1,500"],
		["es", "1.500"],
		["de", "1.500"],
		["it", "1.500"],
		["fr", "1 500"],
	])("reads %s %j as fifteen hundred", async (locale, text) => {
		const amount = open(locale);
		const user = await typeAmount({ amount, text });

		await submit({ locale, user });

		await waitFor(() => expect(donated()).toEqual([1500]));
	});

	it.each([
		["en", "10,000"],
		["es", "10.000"],
		["de", "10.000"],
	])("accepts %s %j, which is the maximum itself", async (locale, text) => {
		const amount = open(locale);
		const user = await typeAmount({ amount, text });

		await submit({ locale, user });

		await waitFor(() => expect(donated()).toEqual([10_000]));
	});

	it.each([
		["en", "30,000"],
		["es", "30.000"],
		["de", "30.000"],
	])("reads %s %j as thirty thousand, which is past the maximum, and not as thirty", async (locale, text) => {
		const amount = open(locale);
		const user = await typeAmount({ amount, text });

		await submit({ locale, user });

		expect(await screen.findByText(AMOUNT_TOO_HIGH)).toBeDefined();
		expect(donated()).toEqual([]);
	});

	it.each([
		["en", "10,001"],
		["es", "10.001"],
	])(
		"refuses %s %j, one past the maximum, with the maximum's own message, and does not clamp it",
		async (locale, text) => {
			const amount = open(locale);
			const user = await typeAmount({ amount, text });
			await user.tab();

			await submit({ locale, user });

			expect(await screen.findByText(AMOUNT_TOO_HIGH)).toBeDefined();
			expect(amount.value).toBe(locale === "en" ? "10,001" : "10.001");
			expect(donated()).toEqual([]);
		},
	);

	it.each([
		["en", "0"],
		["es", "0,5"],
		["de", "0,99"],
	])("refuses %s %j, below the minimum, with the minimum's own message", async (locale, text) => {
		const amount = open(locale);
		const user = await typeAmount({ amount, text });

		await submit({ locale, user });

		expect(await screen.findByText(AMOUNT_TOO_LOW)).toBeDefined();
		expect(donated()).toEqual([]);
	});

	it.each([
		["en", "-5"],
		["es", "-5"],
	])("refuses %s %j, a negative amount, with the minimum's own message", async (locale, text) => {
		const amount = open(locale);
		const user = await typeAmount({ amount, text });

		await submit({ locale, user });

		expect(await screen.findByText(AMOUNT_TOO_LOW)).toBeDefined();
		expect(donated()).toEqual([]);
	});

	it.each([
		["en", "1"],
		["es", "1"],
	])("accepts %s %j, which is the minimum itself", async (locale, text) => {
		const amount = open(locale);
		const user = await typeAmount({ amount, text });

		await submit({ locale, user });

		await waitFor(() => expect(donated()).toEqual([1]));
	});
});

describe("a Donation amount written with the other language's separator", () => {
	it.each([
		["es", "2.5"],
		["es", "2.50"],
		["de", "2.5"],
		["en", "2,5"],
		["en", "2,50"],
	])("reads %s %j as two and a half, never as twenty-five or two hundred and fifty", async (locale, text) => {
		const amount = open(locale);
		const user = await typeAmount({ amount, text });

		await submit({ locale, user });

		await waitFor(() => expect(donated()).toEqual([2.5]));
	});

	it("writes the language's own separator once the field is left holding the other one", async () => {
		const amount = open("es");
		const user = await typeAmount({ amount, text: "2.5" });

		await user.tab();

		expect(amount.value).toBe("2,5");
	});

	it.each([
		["es", "1.234"],
		["en", "1,234"],
	])("keeps %s %j, a separator before exactly three digits, as the language's grouping", async (locale, text) => {
		const amount = open(locale);
		const user = await typeAmount({ amount, text });

		await submit({ locale, user });

		await waitFor(() => expect(donated()).toEqual([1234]));
	});
});

describe("a Donation amount that is empty or cannot be read", () => {
	it("stays empty while it is typed over, instead of turning into 0", async () => {
		const amount = open("en");
		const user = userEvent.setup();

		await user.clear(amount);
		expect(amount.value).toBe("");

		await user.type(amount, "1");
		await user.clear(amount);
		expect(amount.value).toBe("");
	});

	it.each(["en", "es", "de"])("fails an empty submit in %s on the minimum's own message, not Zod's", async (locale) => {
		const amount = open(locale);
		const user = await typeAmount({ amount, text: "" });

		await submit({ locale, user });

		expect(await screen.findByText(AMOUNT_TOO_LOW)).toBeDefined();
		expect(screen.queryByText(/expected number/i)).toBeNull();
		expect(donated()).toEqual([]);
	});

	it.each([
		["en", "."],
		["es", ","],
		["es", "1.2.3"],
		["de", "1.2.3"],
		["en", "1,2,3"],
	])("fails %s %j on the minimum's own message, as an emptied field does", async (locale, text) => {
		const amount = open(locale);
		const user = await typeAmount({ amount, text });

		await submit({ locale, user });

		expect(await screen.findByText(AMOUNT_TOO_LOW)).toBeDefined();
		expect(donated()).toEqual([]);
	});

	it("leaves the field empty once it is left holding what it cannot read", async () => {
		const amount = open("es");
		const user = await typeAmount({ amount, text: "1.2.3" });

		await user.tab();

		expect(amount.value).toBe("");
	});

	it("takes a preset after what could not be read, and shows it", async () => {
		const amount = open("es");
		const user = await typeAmount({ amount, text: "1.2.3" });

		await user.click(preset(15));

		expect(amount.value).toBe("15");
	});
});

describe("the Donation amount's keyboard", () => {
	it("steps by one with the arrow keys, from the amount typed, never below the minimum", async () => {
		const amount = open("en");
		const user = userEvent.setup();

		await user.click(amount);
		await user.keyboard("{ArrowUp}");
		expect(amount.value).toBe("6");

		await user.keyboard("{ArrowDown}{ArrowDown}");
		expect(amount.value).toBe("4");

		await user.keyboard("{Home}");
		expect(amount.value).toBe("1");

		await user.keyboard("{ArrowDown}");
		expect(amount.value).toBe("1");
	});

	it("goes to the maximum with End in the language's own grouping, and no further", async () => {
		const amount = open("es");
		const user = userEvent.setup();

		await user.click(amount);
		await user.keyboard("{End}");
		expect(amount.value).toBe("10.000");

		await user.keyboard("{ArrowUp}");
		expect(amount.value).toBe("10.000");
	});

	it("steps from a decimal to the next whole euro", async () => {
		const amount = open("es");
		const user = await typeAmount({ amount, text: "2,5" });

		await user.keyboard("{ArrowUp}");

		expect(amount.value).toBe("3");
	});
});

describe("the Donation amount beside the quick amounts", () => {
	it("shows a preset in the language's spelling after a decimal was typed, and submits it", async () => {
		const amount = open("es");
		const user = await typeAmount({ amount, text: "2,5" });

		await user.click(preset(10));
		expect(amount.value).toBe("10");

		await submit({ locale: "es", user });

		await waitFor(() => expect(donated()).toEqual([10]));
	});

	it("starts at the middle preset, five euros", () => {
		const amount = open("de");

		expect(amount.value).toBe("5");
	});
});
