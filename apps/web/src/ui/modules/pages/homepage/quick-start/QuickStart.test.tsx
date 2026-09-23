import type { CountryDTO } from "@application/dto/country/types";
import { render, screen } from "@testing-library/react";
import type { Locale } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCountries = vi.hoisted(() => vi.fn());
const getCurrentYear = vi.hoisted(() => vi.fn());

vi.mock("@infrastructure/services/countries/getCountries", () => ({ getCountries }));
vi.mock("@ui/utils/getCurrentYear", () => ({ getCurrentYear }));
vi.mock("./QuickStartClient", () => ({
	QuickStartClient: ({ countries, currentYear }: { countries: CountryDTO[]; currentYear: number }) => (
		<div data-testid="client" data-year={currentYear}>
			<ul>
				{countries.map((country) => (
					<li key={country.value}>{country.label}</li>
				))}
			</ul>
		</div>
	),
}));

const { QuickStart } = await import("./QuickStart");

const COUNTRIES = [
	{ value: "ES", label: "Spain", flag: "es" },
	{ value: "FR", label: "France", flag: "fr" },
] as CountryDTO[];

const renderQuickStart = async (locale = "en") => render(await QuickStart({ locale: locale as Locale }));

beforeEach(() => {
	getCountries.mockReset();
	getCountries.mockReturnValue(COUNTRIES);
	getCurrentYear.mockReset();
	getCurrentYear.mockResolvedValue(2026);
});

describe("QuickStart", () => {
	it("fetches the countries for the locale it was handed", async () => {
		await renderQuickStart("fr");

		expect(getCountries).toHaveBeenCalledExactlyOnceWith("fr");
	});

	it("hands the client shell the list it fetched and the year it resolved", async () => {
		await renderQuickStart();

		expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toStrictEqual(["Spain", "France"]);
		expect(screen.getByTestId("client").getAttribute("data-year")).toBe("2026");
	});

	it("hands the client an empty list rather than nothing when the service found none", async () => {
		getCountries.mockReturnValue([]);

		await renderQuickStart();

		expect(screen.getByRole("list")).toBeTruthy();
		expect(screen.queryAllByRole("listitem")).toHaveLength(0);
	});
});
