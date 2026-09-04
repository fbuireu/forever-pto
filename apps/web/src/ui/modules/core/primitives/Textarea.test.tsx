import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./Textarea";

const field = () => screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement;

describe("Textarea", () => {
	it("renders a multi-line text box carrying the textarea slot", () => {
		render(<Textarea aria-label="Message" />);

		expect(field().tagName).toBe("TEXTAREA");
		expect(field().dataset.slot).toBe("textarea");
	});

	it("reports what is typed", async () => {
		const onChange = vi.fn();
		render(<Textarea aria-label="Message" onChange={onChange} />);

		await userEvent.type(field(), "hi");

		expect(onChange).toHaveBeenCalledTimes(2);
		expect(field().value).toBe("hi");
	});

	it("passes disabled through so it cannot be typed into", () => {
		render(<Textarea aria-label="Message" disabled />);

		expect(field().disabled).toBe(true);
	});

	it("lets the caller's class win over its own on the same property", () => {
		render(<Textarea aria-label="Message" className="min-h-12" />);

		expect(field().className).toContain("min-h-12");
		expect(field().className).not.toContain("min-h-24");
	});
});
