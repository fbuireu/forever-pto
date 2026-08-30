import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ year: 2026, setYear: vi.fn() }));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: unknown) => unknown) => selector({ year: store.year, setYear: store.setYear }),
}));

vi.mock("@ui/modules/core/animate/base/Popover", () => ({
	Popover: ({ children }: { children?: ReactNode }) => <div data-primitive="popover">{children}</div>,
	PopoverTrigger: ({ children }: { children?: ReactNode }) => <div data-primitive="popover-trigger">{children}</div>,
	PopoverContent: ({ children, ...props }: ComponentProps<"div">) => <div {...props}>{children}</div>,
}));

const { Years } = await import("./Years");

const renderYears = (currentYear = 2026) =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<Years currentYear={currentYear} />
		</NextIntlClientProvider>,
	);

const offeredYears = () => screen.getAllByRole("option").map((option) => option.textContent?.trim());

const trigger = () => screen.getByRole("button", { name: en.sidebar.years.title });

beforeEach(() => {
	store.year = 2026;
	store.setYear.mockClear();
});

describe("Years", () => {
	it("offers ten years around the current one, five behind it and four ahead", () => {
		renderYears(2026);

		expect(offeredYears()).toStrictEqual([
			"2021",
			"2022",
			"2023",
			"2024",
			"2025",
			"2026",
			"2027",
			"2028",
			"2029",
			"2030",
		]);
	});

	it("moves the whole window with the year it is given rather than pinning a decade", () => {
		renderYears(2030);

		expect(offeredYears()).toStrictEqual([
			"2025",
			"2026",
			"2027",
			"2028",
			"2029",
			"2030",
			"2031",
			"2032",
			"2033",
			"2034",
		]);
	});

	it("shows the year the store holds, which need not be the current one", () => {
		store.year = 2024;

		renderYears(2026);

		expect(trigger().textContent).toContain("2024");
	});

	it("stores the year that was picked", async () => {
		renderYears(2026);

		await userEvent.click(screen.getByRole("option", { name: "2028" }));

		expect(store.setYear).toHaveBeenCalledExactlyOnceWith(2028);
	});

	it("hands the store a number, not the string the list item carries", async () => {
		renderYears(2026);

		await userEvent.click(screen.getByRole("option", { name: "2028" }));

		expect(typeof store.setYear.mock.calls[0]?.[0]).toBe("number");
	});

	it("names the control, so the field label points at something", () => {
		const { container } = renderYears();

		expect(container.querySelector("label")?.getAttribute("for")).toBe("years");
		expect(trigger().id).toBe("years");
	});

	it("reports the list it opens as closed until it is opened", () => {
		renderYears();

		expect(trigger().getAttribute("aria-expanded")).toBe("false");
		expect(trigger().getAttribute("aria-haspopup")).toBe("listbox");
	});
});
