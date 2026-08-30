import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const filters = vi.hoisted(() => ({ country: "ES", region: "", setRegion: vi.fn() }));

const location = vi.hoisted(() => ({
	regions: [] as { value: string; label: string }[],
	fetchRegions: vi.fn(),
}));

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

const { Regions } = await import("./Regions");

const renderRegions = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<Regions />
		</NextIntlClientProvider>,
	);

const picker = () => screen.getByRole("button", { name: en.sidebar.region.title });

beforeEach(() => {
	filters.country = "ES";
	filters.region = "";
	filters.setRegion.mockClear();
	location.regions = [];
	location.fetchRegions.mockClear();
});

describe("Regions", () => {
	it("looks the regions up for the country that is selected", () => {
		renderRegions();

		expect(location.fetchRegions).toHaveBeenCalledExactlyOnceWith("ES");
	});

	it("looks nothing up while no country has been picked", () => {
		filters.country = "";

		renderRegions();

		expect(location.fetchRegions).not.toHaveBeenCalled();
	});

	it("looks them up again when the country changes, and only then", () => {
		const { rerender } = renderRegions();

		rerender(
			<NextIntlClientProvider locale="en" messages={en}>
				<Regions />
			</NextIntlClientProvider>,
		);
		expect(location.fetchRegions).toHaveBeenCalledOnce();

		filters.country = "FR";
		rerender(
			<NextIntlClientProvider locale="en" messages={en}>
				<Regions />
			</NextIntlClientProvider>,
		);

		expect(location.fetchRegions).toHaveBeenLastCalledWith("FR");
		expect(location.fetchRegions).toHaveBeenCalledTimes(2);
	});

	it("cannot be picked from until a country has been", () => {
		filters.country = "";

		renderRegions();

		expect(picker().hasAttribute("disabled")).toBe(true);
	});

	it("can be picked from once one has", () => {
		renderRegions();

		expect(picker().hasAttribute("disabled")).toBe(false);
	});

	it("offers what the location store holds", () => {
		location.regions = [
			{ value: "CT", label: "Catalonia" },
			{ value: "MD", label: "Madrid" },
		];

		renderRegions();

		expect(screen.getAllByRole("option").map((option) => option.textContent)).toStrictEqual(["Catalonia", "Madrid"]);
	});

	it("stores the region that was picked", async () => {
		location.regions = [{ value: "CT", label: "Catalonia" }];

		renderRegions();
		await userEvent.click(screen.getByRole("option", { name: "Catalonia" }));

		expect(filters.setRegion).toHaveBeenCalledExactlyOnceWith("CT");
	});
});
