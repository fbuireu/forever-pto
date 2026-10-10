import type { CountryDTO } from "@application/dto/country/types";
import { useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
import { Strategy } from "@domain/calendar/types";
import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn() }));
const cookie = vi.hoisted(() => ({ country: undefined as string | undefined }));
const track = vi.hoisted(() => vi.fn());

vi.mock("@application/i18n/navigation", () => ({ useRouter: () => router }));
vi.mock("@ui/utils/userCountry", () => ({ getUserCountryFromCookie: () => cookie.country }));
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));
vi.mock("@ui/modules/core/animate/base/Popover", () => ({
	Popover: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	PopoverTrigger: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	PopoverContent: ({ children }: ComponentProps<"div">) => <div>{children}</div>,
}));

import { InlineQuickStartForm } from "./InlineQuickStartForm";

const COUNTRIES = [
	{ value: "ES", label: "Spain", flag: "es" },
	{ value: "FR", label: "France", flag: "fr" },
] as CountryDTO[];

const quickStart = enMessages.quickStart;

const renderForm = () =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<InlineQuickStartForm countries={COUNTRIES} currentYear={2026} />
		</NextIntlClientProvider>,
	);

const planButton = () => screen.getByRole("button", { name: quickStart.finish }) as HTMLButtonElement;

beforeEach(() => {
	router.push.mockClear();
	track.mockClear();
	cookie.country = undefined;
	useFiltersStore.getState().resetToDefaults();
	useHolidaysStore.setState({ planAskedFor: false });
});

describe("InlineQuickStartForm", () => {
	it("asks only for the Country, the budget and the year", () => {
		renderForm();

		expect(screen.getByLabelText(quickStart.location.country)).toBeDefined();
		expect(screen.getByRole("button", { name: enMessages.ptoDays.increase })).toBeDefined();
		expect(screen.getByRole("radio", { name: "2026" })).toBeDefined();
		expect(screen.queryByText(/Region/)).toBeNull();
		expect(screen.queryByLabelText(new RegExp(enMessages.sidebar.strategy.optimized.label))).toBeNull();
	});

	it("holds the plan back until a Country is known", () => {
		renderForm();

		expect(planButton().disabled).toBe(true);
	});

	it("starts from the Country the edge detected", () => {
		cookie.country = "es";
		renderForm();

		expect(planButton().disabled).toBe(false);
	});

	it("writes what was picked into the filters, asks for a plan and opens the planner", async () => {
		useFiltersStore.getState().setStrategy(Strategy.OPTIMIZED);
		renderForm();

		await userEvent.click(screen.getByRole("option", { name: /France/ }));
		fireEvent.click(screen.getByRole("button", { name: enMessages.ptoDays.increase }));
		fireEvent.click(screen.getByRole("radio", { name: "2027" }));
		fireEvent.click(planButton());

		const filters = useFiltersStore.getState();
		expect(filters.country).toBe("FR");
		expect(filters.region).toBe("");
		expect(filters.ptoDays).toBe(23);
		expect(filters.year).toBe(2027);
		expect(filters.strategy).toBe(Strategy.OPTIMIZED);
		expect(useHolidaysStore.getState().planAskedFor).toBe(true);
		expect(router.push).toHaveBeenCalledExactlyOnceWith("/planner");
	});

	it("keeps the Region of a Country the visitor already planned for", () => {
		useFiltersStore.getState().setCountry("es");
		useFiltersStore.getState().setRegion("CT");
		renderForm();

		fireEvent.click(planButton());

		expect(useFiltersStore.getState().region).toBe("CT");
	});

	it("reports the finish from the homepage form, apart from the dialog's", () => {
		cookie.country = "es";
		renderForm();

		fireEvent.click(planButton());

		expect(track).toHaveBeenCalledExactlyOnceWith({
			event: "quick_start_completed",
			properties: expect.objectContaining({ country: "es", ptoDays: 22, source: "inline" }),
		});
	});

	it("counts the form as opened on its first change, once, so the funnel compares it with the dialog", () => {
		renderForm();

		fireEvent.click(screen.getByRole("button", { name: enMessages.ptoDays.increase }));
		fireEvent.click(screen.getByRole("button", { name: enMessages.ptoDays.increase }));

		expect(track).toHaveBeenCalledExactlyOnceWith({ event: "quick_start_opened", properties: { source: "inline" } });
	});
});
