import type { CountryDTO } from "@application/dto/country/types";
import { render, screen } from "@testing-library/react";
import type { Locale } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCountries = vi.hoisted(() => vi.fn());

vi.mock("@infrastructure/services/countries/getCountries", () => ({ getCountries }));

vi.mock("next/dynamic", () => ({
	default:
		() =>
		({ countries }: { countries: CountryDTO[] }) => (
			<ul>
				{countries.map((country) => (
					<li key={country.value}>{country.label}</li>
				))}
			</ul>
		),
}));

const { Countries } = await import("./Countries");

const COUNTRIES = [
	{ value: "ES", label: "Spain", flag: "es" },
	{ value: "FR", label: "France", flag: "fr" },
] as CountryDTO[];

const renderCountries = async (locale = "en") => render(await Countries({ locale: locale as Locale }));

beforeEach(() => {
	getCountries.mockReset();
	getCountries.mockReturnValue(COUNTRIES);
});

describe("Countries", () => {
	it("fetches for the locale it was handed rather than reading the request itself", async () => {
		await renderCountries("fr");

		expect(getCountries).toHaveBeenCalledExactlyOnceWith("fr");
	});

	it("hands the client child the list it fetched, in the order the service returned", async () => {
		await renderCountries();

		expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toStrictEqual(["Spain", "France"]);
	});

	it("hands the client an empty list rather than nothing when the service found none", async () => {
		getCountries.mockReturnValue([]);

		await renderCountries();

		expect(screen.getByRole("list")).toBeTruthy();
		expect(screen.queryAllByRole("listitem")).toHaveLength(0);
	});
});
