import type { CountryDTO } from "@application/dto/country/types";
import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const filters = vi.hoisted(() => ({ country: "", setCountry: vi.fn() }));

const location = vi.hoisted(() => ({ setCountries: vi.fn() }));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: unknown) => unknown) => selector(filters),
}));

vi.mock("@application/stores/location", () => ({
	useLocationStore: (selector: (state: unknown) => unknown) => selector(location),
}));

vi.mock("@ui/modules/core/animate/base/Popover", () => ({
	Popover: ({ children }: { children?: ReactNode }) => <div data-primitive="popover">{children}</div>,
	PopoverTrigger: ({ children }: { children?: ReactNode }) => <div data-primitive="popover-trigger">{children}</div>,
	PopoverContent: ({ children, ...props }: ComponentProps<"div">) => <div {...props}>{children}</div>,
}));

const { CountriesClient } = await import("./CountriesClient");

const COUNTRIES = [
	{ value: "ES", label: "Spain", flag: "es" },
	{ value: "FR", label: "France", flag: "fr" },
] as CountryDTO[];

const renderCountries = (countries: CountryDTO[] = COUNTRIES) =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<CountriesClient countries={countries} />
		</NextIntlClientProvider>,
	);

beforeEach(() => {
	filters.country = "";
	filters.setCountry.mockClear();
	location.setCountries.mockClear();
});

describe("CountriesClient", () => {
	it("hands the server's list to the store, which is the only place the rest of the app reads it from", () => {
		renderCountries();

		expect(location.setCountries).toHaveBeenCalledExactlyOnceWith(COUNTRIES);
	});

	it("leaves the store alone rather than emptying it when the server sent nothing", () => {
		renderCountries([]);

		expect(location.setCountries).not.toHaveBeenCalled();
	});

	it("offers every country it was given", () => {
		renderCountries();

		expect(screen.getAllByRole("option").map((option) => option.textContent)).toStrictEqual(["Spain", "France"]);
	});

	it("stores the country that was picked, by its code", async () => {
		renderCountries();

		await userEvent.click(screen.getByRole("option", { name: "France" }));

		expect(filters.setCountry).toHaveBeenCalledExactlyOnceWith("FR");
	});

	it("names the control, so the field label points at something", () => {
		const { container } = renderCountries();

		expect(container.querySelector("label")?.getAttribute("for")).toBe("countries");
		expect(screen.getByRole("button", { name: en.sidebar.country.title }).id).toBe("countries");
	});
});
