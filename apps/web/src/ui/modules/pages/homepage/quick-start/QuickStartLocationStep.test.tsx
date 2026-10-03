import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@ui/modules/core/animate/base/Popover", () => ({
	Popover: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	PopoverTrigger: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	PopoverContent: ({ children }: ComponentProps<"div">) => <div>{children}</div>,
}));

import { QuickStartLocationStep } from "./QuickStartLocationStep";

const COUNTRIES = [
	{ value: "ES", label: "Spain", flag: "es" },
	{ value: "FR", label: "France", flag: "fr" },
] as CountryDTO[];

const REGIONS = [{ value: "CT", label: "Catalonia" }] as RegionDTO[];

const location = enMessages.quickStart.location;
const REGION_LABEL = "Region (optional)";

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface RenderStepParams {
	country?: string;
	region?: string;
	regions?: RegionDTO[];
	locale?: Locale;
	messages?: typeof enMessages;
}

const renderStep = ({
	country = "",
	region = "",
	regions = [],
	locale = "en",
	messages = enMessages,
}: RenderStepParams = {}) => {
	const onChange = vi.fn();

	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<QuickStartLocationStep countries={COUNTRIES} regions={regions} draft={{ country, region }} onChange={onChange} />
		</NextIntlClientProvider>,
	);

	return onChange;
};

describe("QuickStartLocationStep", () => {
	it("labels both controls, the region as optional", () => {
		renderStep();

		expect(screen.getByLabelText(location.country)).toBeDefined();
		expect(screen.getByLabelText(REGION_LABEL)).toBeDefined();
	});

	it("hands back the chosen country with the region cleared, since regions belong to a country", async () => {
		const onChange = renderStep();

		await userEvent.click(screen.getByRole("option", { name: /France/ }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith({ country: "FR", region: "" });
	});

	it("keeps the region control disabled until a country with regions is chosen", () => {
		renderStep();

		expect((screen.getByLabelText(REGION_LABEL) as HTMLButtonElement).disabled).toBe(true);
	});

	it("says so when the chosen country has no regional calendars", () => {
		renderStep({ country: "FR" });

		expect(screen.getByText(location.noRegions)).toBeDefined();
		expect((screen.getByLabelText(REGION_LABEL) as HTMLButtonElement).disabled).toBe(true);
	});

	it("offers the regions once the country has some, and hands the chosen one back", async () => {
		const onChange = renderStep({ country: "ES", regions: REGIONS });

		expect(screen.queryByText(location.noRegions)).toBeNull();
		await userEvent.click(screen.getByRole("option", { name: /Catalonia/ }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith({ region: "CT" });
	});

	it.each(Object.entries(BUNDLES))(
		"labels the %s region from one message, with its qualifier muted",
		(locale, messages) => {
			renderStep({ locale: locale as Locale, messages });
			const label = document.querySelector('label[for="quick-start-region"]');

			expect(label?.querySelector("span")?.textContent).toMatch(/^\(.+\)$/);
			expect(label?.textContent).not.toMatch(/[<>{}]|quickStart\./);
		},
	);
});
