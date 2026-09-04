import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Label } from "./Label";

describe("Label", () => {
	it("names the control it points at, so clicking the label focuses the field", async () => {
		render(
			<>
				<Label htmlFor="days">PTO days</Label>
				<input id="days" />
			</>,
		);

		const input = screen.getByLabelText("PTO days");
		await userEvent.click(screen.getByText("PTO days"));

		expect(document.activeElement).toBe(input);
	});

	it("renders as a real label element carrying its text", () => {
		render(<Label htmlFor="days">PTO days</Label>);

		const label = screen.getByText("PTO days");
		expect(label.tagName).toBe("LABEL");
		expect(label.getAttribute("for")).toBe("days");
	});

	it("merges the caller's className and passes other attributes through", () => {
		render(
			<Label htmlFor="days" className="sr-only" data-testid="days-label">
				PTO days
			</Label>,
		);

		const label = screen.getByTestId("days-label");
		expect(label.className).toContain("sr-only");
		expect(label.className).toContain("text-sm");
	});
});
