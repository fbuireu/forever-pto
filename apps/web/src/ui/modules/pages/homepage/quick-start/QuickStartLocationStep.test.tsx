import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import enMessages from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
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

interface RenderStepParams {
	country?: string;
	region?: string;
	regions?: RegionDTO[];
}

const renderStep = ({ country = "", region = "", regions = [] }: RenderStepParams = {}) => {
	const onChange = vi.fn();

	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<QuickStartLocationStep countries={COUNTRIES} regions={regions} draft={{ country, region }} onChange={onChange} />
		</NextIntlClientProvider>,
	);

	return onChange;
};

describe("QuickStartLocationStep", () => {
	it("labels both controls, the region as optional", () => {
		renderStep();

		expect(screen.getByLabelText(location.country)).toBeDefined();
		expect(screen.getByLabelText(`${location.region} (${location.optional})`)).toBeDefined();
	});

	it("hands back the chosen country with the region cleared, since regions belong to a country", async () => {
		const onChange = renderStep();

		await userEvent.click(screen.getByRole("option", { name: /France/ }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith({ country: "FR", region: "" });
	});

	it("keeps the region control disabled until a country with regions is chosen", () => {
		renderStep();

		expect((screen.getByLabelText(`${location.region} (${location.optional})`) as HTMLButtonElement).disabled).toBe(
			true,
		);
	});

	it("says so when the chosen country has no regional calendars", () => {
		renderStep({ country: "FR" });

		expect(screen.getByText(location.noRegions)).toBeDefined();
		expect((screen.getByLabelText(`${location.region} (${location.optional})`) as HTMLButtonElement).disabled).toBe(
			true,
		);
	});

	it("offers the regions once the country has some, and hands the chosen one back", async () => {
		const onChange = renderStep({ country: "ES", regions: REGIONS });

		expect(screen.queryByText(location.noRegions)).toBeNull();
		await userEvent.click(screen.getByRole("option", { name: /Catalonia/ }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith({ region: "CT" });
	});
});
