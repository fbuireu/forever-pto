import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "./InputGroup";

const renderGroup = (align?: ComponentProps<typeof InputGroupAddon>["align"]) =>
	render(
		<InputGroup>
			<InputGroupAddon align={align}>
				<InputGroupText>€</InputGroupText>
				<button type="button">Clear</button>
			</InputGroupAddon>
			<InputGroupInput aria-label="Amount" />
		</InputGroup>,
	);

const addon = () => screen.getByText("€").parentElement as HTMLElement;
const input = () => screen.getByRole("textbox", { name: "Amount" });

describe("InputGroup", () => {
	it("groups the control with its addon under one group role", () => {
		renderGroup();

		expect(screen.getByRole("group").contains(input())).toBe(true);
		expect(input().dataset.slot).toBe("input-group-control");
		expect(addon().dataset.slot).toBe("input-group-addon");
	});

	it("sits the addon at the inline start unless told otherwise", () => {
		renderGroup();

		expect(addon().dataset.align).toBe("inline-start");
		expect(addon().className).toContain("order-first");
	});

	it("moves the addon where it is asked to sit", () => {
		renderGroup("block-end");

		expect(addon().dataset.align).toBe("block-end");
		expect(addon().className).toContain("order-last");
	});

	it("focuses the control when the addon is clicked, so the whole frame acts as the field", async () => {
		renderGroup();

		await userEvent.click(screen.getByText("€"));

		expect(document.activeElement).toBe(input());
	});

	it("leaves focus alone when the click landed on a button inside the addon", async () => {
		renderGroup();

		await userEvent.click(screen.getByRole("button", { name: "Clear" }));

		expect(document.activeElement).not.toBe(input());
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

	it("does not steal focus from a button inside the addon on Enter", () => {
		renderGroup();
		const clear = screen.getByRole("button", { name: "Clear" });
		clear.focus();

		fireEvent.keyDown(clear, { key: "Enter" });

		expect(document.activeElement).toBe(clear);
	});

	it("renders the addon text as an inline span with the caller's class", () => {
		render(<InputGroupText className="font-mono">kg</InputGroupText>);

		const text = screen.getByText("kg");
		expect(text.tagName).toBe("SPAN");
		expect(text.className).toContain("font-mono");
	});
});
