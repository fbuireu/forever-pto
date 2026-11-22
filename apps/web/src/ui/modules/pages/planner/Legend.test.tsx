import { readFileSync } from "node:fs";
import { join } from "node:path";
import enMessages from "@i18n/messages/en.json";
import { fireEvent, type RenderResult, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

vi.mock("./legend.module.css", () => ({ default: {} }));

const { Legend } = await import("./Legend");

const renderLegend = (): RenderResult =>
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

describe("Legend safe areas", () => {
	it("pads its sticky container by the home indicator, so the card stuck at the bottom clears it", () => {
		const source = readFileSync(join(__dirname, "legend.module.css"), "utf8");
		const rule = source.match(/\.sticky_container \{[^}]*\}/)?.[0] ?? "";

		expect(rule).toContain("bottom: 0;");
		expect(rule).toContain("padding-bottom: env(safe-area-inset-bottom);");
	});
});
