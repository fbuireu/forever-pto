import { fireEvent, type RenderResult, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "./InputGroup";

const renderGroup = (): RenderResult =>
	render(
		<InputGroup>
			<InputGroupAddon>
				<InputGroupText>€</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput aria-label="Amount" />
		</InputGroup>,
	);

const addon = (): HTMLElement => screen.getByText("€").parentElement as HTMLElement;
const input = (): HTMLElement => screen.getByRole("textbox", { name: "Amount" });

describe("InputGroup", () => {
	it("groups the control with its addon under one group role", () => {
		renderGroup();

		expect(screen.getByRole("group").contains(input())).toBe(true);
		expect(input().dataset.slot).toBe("input-group-control");
		expect(addon().dataset.slot).toBe("input-group-addon");
	});

	it("sits the addon at the inline start", () => {
		renderGroup();

		expect(addon().dataset.align).toBe("inline-start");
		expect(addon().className).toContain("order-first");
	});

	it("focuses the control when the addon is clicked, so the whole frame acts as the field", async () => {
		renderGroup();

		await userEvent.click(screen.getByText("€"));

		expect(document.activeElement).toBe(input());
	});

	it("focuses the control on Enter or Space from the addon, and on nothing else", () => {
		renderGroup();

		fireEvent.keyDown(addon(), { key: "a" });
		expect(document.activeElement).not.toBe(input());

		fireEvent.keyDown(addon(), { key: "Enter" });
		expect(document.activeElement).toBe(input());

		input().blur();
		fireEvent.keyDown(addon(), { key: " " });
		expect(document.activeElement).toBe(input());
	});

	it("renders the addon text as an inline span with the caller's class", () => {
		render(<InputGroupText className="font-mono">kg</InputGroupText>);

		const text = screen.getByText("kg");
		expect(text.tagName).toBe("SPAN");
		expect(text.className).toContain("font-mono");
	});
});
