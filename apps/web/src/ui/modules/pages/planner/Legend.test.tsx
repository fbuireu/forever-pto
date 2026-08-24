import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

vi.mock("./legend.module.css", () => ({ default: {} }));

const { Legend } = await import("./Legend");

const renderLegend = () =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<Legend />
		</NextIntlClientProvider>,
	);

describe("Legend disclosure", () => {
	it("is a named button, not a nameless checkbox sitting invisibly in the tab order", () => {
		const { container } = renderLegend();

		expect(container.querySelector('input[type="checkbox"]')).toBeNull();
		expect(screen.getByRole("button", { name: enMessages.legend.showLegend }).getAttribute("aria-expanded")).toBe(
			"false",
		);
	});

	it("says it expanded, and renames itself, so the press is not silent", () => {
		renderLegend();

		fireEvent.click(screen.getByRole("button", { name: enMessages.legend.showLegend }));

		const toggle = screen.getByRole("button", { name: enMessages.legend.hideLegend });
		expect(toggle.getAttribute("aria-expanded")).toBe("true");
	});

	it("names what it expands, and that element is on the page", () => {
		const { container } = renderLegend();
		const controls = screen.getByRole("button").getAttribute("aria-controls");

		expect(controls).not.toBeNull();
		expect(container.querySelector(`#${controls}`)).not.toBeNull();
	});
});
