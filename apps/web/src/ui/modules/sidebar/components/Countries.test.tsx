import type { CountryDTO } from "@application/dto/country/types";
import { render, screen } from "@testing-library/react";
import type { Locale } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCountries = vi.hoisted(() => vi.fn());

const { lazyClient, MockCountriesClient } = vi.hoisted(() => ({
	lazyClient: { loader: undefined as (() => Promise<unknown>) | undefined },
	MockCountriesClient: vi.fn().mockReturnValue(null),
}));

vi.mock("@infrastructure/services/countries/getCountries", () => ({ getCountries }));

vi.mock("./CountriesClient", () => ({ CountriesClient: MockCountriesClient }));

vi.mock("next/dynamic", () => ({
	default: (loader: () => Promise<unknown>) => {
		lazyClient.loader = loader;
		return ({ countries }: { countries: CountryDTO[] }) => (
			<ul>
				{countries.map((country) => (
					<li key={country.value}>{country.label}</li>
				))}
			</ul>
		);
	},
}));

const { Countries } = await import("./Countries");

const COUNTRIES = [
	{ value: "ES", label: "Spain", flag: "es" },
	{ value: "FR", label: "France", flag: "fr" },
] as CountryDTO[];

const renderCountries = (locale = "en") => render(Countries({ locale: locale as Locale }));

beforeEach(() => {
	getCountries.mockReset();
	getCountries.mockReturnValue(COUNTRIES);
});

describe("Countries", () => {
	it("asks for the list in the locale it was handed rather than reading the request itself", () => {
		renderCountries("fr");

		expect(getCountries).toHaveBeenCalledExactlyOnceWith("fr");
	});

	it("hands the client child the list the service returned, in its order", () => {
		renderCountries();

		expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toStrictEqual(["Spain", "France"]);
	});

	it("loads the client half behind the split, from the export it names", async () => {
		expect(await lazyClient.loader?.()).toBe(MockCountriesClient);
	});

	it("hands the client an empty list rather than nothing when the service found none", () => {
		getCountries.mockReturnValue([]);

		renderCountries();

		expect(screen.getByRole("list")).toBeTruthy();
		expect(screen.queryAllByRole("listitem")).toHaveLength(0);
	});

	it("renders in the pass that calls it, since the list it reads is already in memory", () => {
		expect(Countries({ locale: "en" })).not.toBeInstanceOf(Promise);
	});
});
