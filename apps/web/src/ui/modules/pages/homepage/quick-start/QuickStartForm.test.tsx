import type { CountryDTO } from "@application/dto/country/types";
import { useFiltersStore } from "@application/stores/filters";
import { useLocationStore } from "@application/stores/location";
import { useUIStore } from "@application/stores/ui";
import { FilterStrategy } from "@domain/calendar/types";
import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn() }));
const cookie = vi.hoisted(() => ({ country: undefined as string | undefined }));
const getRegions = vi.hoisted(() => vi.fn());
const track = vi.hoisted(() => vi.fn());

vi.mock("@application/i18n/navigation", () => ({ useRouter: () => router }));
vi.mock("@ui/utils/userCountry", () => ({ getUserCountryFromCookie: () => cookie.country }));
vi.mock("@infrastructure/services/regions/getRegions", () => ({ getRegions }));
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));
vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@ui/modules/core/animate/base/Dialog", () => ({
	DialogHeader: ({ children }: { children: ReactNode }) => <header>{children}</header>,
	DialogFooter: ({ children }: { children: ReactNode }) => <footer>{children}</footer>,
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
	DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

import { QuickStartForm } from "./QuickStartForm";

const COUNTRIES = [
	{ value: "ES", label: "Spain", flag: "es" },
	{ value: "FR", label: "France", flag: "fr" },
] as CountryDTO[];

const REGIONS_BY_COUNTRY: Record<string, { value: string; label: string }[]> = {
	es: [{ value: "CT", label: "Catalonia" }],
};

const quickStart = enMessages.quickStart;

const renderForm = () =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<QuickStartForm countries={COUNTRIES} currentYear={2026} />
		</NextIntlClientProvider>,
	);

const next = () => fireEvent.click(screen.getByRole("button", { name: quickStart.next }));
const back = () => fireEvent.click(screen.getByRole("button", { name: quickStart.back }));
const finish = () => fireEvent.click(screen.getByRole("button", { name: quickStart.finish }));

beforeEach(() => {
	router.push.mockClear();
	track.mockClear();
	cookie.country = undefined;
	getRegions.mockReset();
	getRegions.mockImplementation(({ countryCode }: { countryCode: string }) => REGIONS_BY_COUNTRY[countryCode] ?? []);
	useFiltersStore.getState().resetToDefaults();
	useLocationStore.setState({ countries: [], regions: [] });
	useUIStore.setState({ quickStartOpen: true });
});

describe("QuickStartForm", () => {
	it("opens on the location step, counting it as the first of three", () => {
		renderForm();

		expect(screen.getByRole("heading", { name: quickStart.location.title })).toBeDefined();
		expect(screen.getByText("Step 1 of 3")).toBeDefined();
		expect(screen.getByText(quickStart.steps.location)).toBeDefined();
	});

	it("holds the location step until a country is known, and the back button on the first step", () => {
		renderForm();

		expect((screen.getByRole("button", { name: quickStart.next }) as HTMLButtonElement).disabled).toBe(true);
		expect((screen.getByRole("button", { name: quickStart.back }) as HTMLButtonElement).disabled).toBe(true);
	});

	it("preselects the country the edge detected and loads its regions", () => {
		cookie.country = "es";
		renderForm();

		expect(screen.getByLabelText(quickStart.location.country).textContent).toContain("Spain");
		expect(getRegions).toHaveBeenCalledWith({ countryCode: "es" });
		expect((screen.getByRole("button", { name: quickStart.next }) as HTMLButtonElement).disabled).toBe(false);
	});

	it("prefers the country already in the store over the detected one", () => {
		cookie.country = "es";
		useFiltersStore.getState().setCountry("FR");
		renderForm();

		expect(screen.getByLabelText(quickStart.location.country).textContent).toContain("France");
	});

	it("walks forward and back through the steps without losing the draft", () => {
		cookie.country = "es";
		renderForm();

		next();
		expect(screen.getByRole("heading", { name: quickStart.ptoDays.title })).toBeDefined();
		fireEvent.click(screen.getByLabelText("2027"));

		next();
		expect(screen.getByRole("heading", { name: quickStart.settings.title })).toBeDefined();
		expect(screen.getByText("Step 3 of 3")).toBeDefined();
		expect(screen.getByRole("button", { name: quickStart.finish })).toBeDefined();

		back();
		expect(screen.getByRole("heading", { name: quickStart.ptoDays.title })).toBeDefined();
		expect((screen.getByLabelText("2027") as HTMLInputElement).checked).toBe(true);

		back();
		expect(screen.getByLabelText(quickStart.location.country).textContent).toContain("Spain");
	});

	it("writes the whole draft into the filters store, closes, and sends the reader into the planner", () => {
		cookie.country = "es";
		renderForm();

		next();
		fireEvent.click(screen.getByRole("button", { name: enMessages.ptoDays.increase }));
		fireEvent.click(screen.getByLabelText("2027"));
		next();
		fireEvent.click(screen.getByLabelText(new RegExp(enMessages.sidebar.strategy.optimized.label)));
		fireEvent.click(screen.getByRole("switch", { name: enMessages.sidebar.allowPastDays.title }));
		fireEvent.change(screen.getByRole("slider", { name: enMessages.sidebar.carryOverMonths.title }), {
			target: { value: "4" },
		});
		finish();

		const filters = useFiltersStore.getState();
		expect(filters.country).toBe("es");
		expect(filters.region).toBe("");
		expect(filters.ptoDays).toBe(23);
		expect(filters.year).toBe(2027);
		expect(filters.strategy).toBe(FilterStrategy.OPTIMIZED);
		expect(filters.allowPastDays).toBe(true);
		expect(filters.carryOverMonths).toBe(4);
		expect(useUIStore.getState().quickStartOpen).toBe(false);
		expect(router.push).toHaveBeenCalledExactlyOnceWith("/planner");
	});

	it("reports each step it leaves and the planning inputs it finishes with", () => {
		cookie.country = "es";
		renderForm();

		next();
		fireEvent.click(screen.getByRole("button", { name: enMessages.ptoDays.increase }));
		next();
		finish();

		expect(track.mock.calls.map(([call]) => call)).toStrictEqual([
			{ event: "quick_start_step_completed", properties: { step: "location" } },
			{ event: "quick_start_step_completed", properties: { step: "ptoDays" } },
			{
				event: "quick_start_completed",
				properties: {
					ptoDays: 23,
					country: "es",
					region: "",
					year: expect.any(Number),
					strategy: FilterStrategy.GROUPED,
					allowPastDays: false,
					carryOverMonths: 1,
				},
			},
		]);
	});

	it("tells its owner which step is showing, so an abandonment can name it", () => {
		cookie.country = "es";
		const onStepChange = vi.fn();
		render(
			<NextIntlClientProvider locale="en" messages={enMessages}>
				<QuickStartForm countries={COUNTRIES} currentYear={2026} onStepChange={onStepChange} />
			</NextIntlClientProvider>,
		);

		expect(onStepChange).toHaveBeenLastCalledWith("location");
		next();
		expect(onStepChange).toHaveBeenLastCalledWith("ptoDays");
	});

	it("leaves the store untouched until the last step is confirmed", () => {
		cookie.country = "es";
		renderForm();

		next();
		fireEvent.click(screen.getByRole("button", { name: enMessages.ptoDays.increase }));

		expect(useFiltersStore.getState().ptoDays).toBe(22);
		expect(useFiltersStore.getState().country).toBe("");
		expect(router.push).not.toHaveBeenCalled();
	});
});
