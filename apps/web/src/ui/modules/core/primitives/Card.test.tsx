import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card";

const slot = (container: HTMLElement, name: string) =>
	container.querySelector(`[data-slot="${name}"]`) as HTMLElement | null;

describe("Card", () => {
	it("marks each part with its slot, so a parent can reach one without a class contract", () => {
		const { container } = render(
			<Card>
				<CardHeader>
					<CardTitle>Summary</CardTitle>
					<CardDescription>What the plan buys</CardDescription>
				</CardHeader>
				<CardContent>12 days</CardContent>
			</Card>,
		);

		for (const name of ["card", "card-header", "card-title", "card-description", "card-content"]) {
			expect(slot(container, name)).not.toBeNull();
		}
		expect(slot(container, "card-title")?.textContent).toBe("Summary");
		expect(slot(container, "card-description")?.textContent).toBe("What the plan buys");
		expect(slot(container, "card-content")?.textContent).toBe("12 days");
	});

	it("renders the title as a plain div unless asked for a heading, so a card cannot invent an outline level", () => {
		render(<CardTitle>Summary</CardTitle>);

		expect(screen.queryByRole("heading")).toBeNull();
		expect(screen.getByText("Summary").tagName).toBe("DIV");
	});

	it("renders the title at the heading level the caller names", () => {
		render(<CardTitle as="h2">Summary</CardTitle>);

		expect(screen.getByRole("heading", { level: 2, name: "Summary" })).toBeDefined();
	});

	it("merges the caller's className on every part, its own winning on the same property", () => {
		const { container } = render(
			<Card className="w-64">
				<CardHeader className="pb-0">
					<CardTitle className="text-lg">T</CardTitle>
					<CardDescription className="italic">D</CardDescription>
				</CardHeader>
				<CardContent className="px-0">C</CardContent>
			</Card>,
		);

		expect(slot(container, "card")?.className).toContain("w-64");
		expect(slot(container, "card-header")?.className).toContain("pb-0");
		expect(slot(container, "card-title")?.className).toContain("text-lg");
		expect(slot(container, "card-description")?.className).toContain("italic");
		expect(slot(container, "card-content")?.className).toContain("px-0");
		expect(slot(container, "card-content")?.className).not.toContain("px-6");
	});
});
