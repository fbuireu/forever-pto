import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./Input";

const field = () => screen.getByRole("textbox", { name: "Email" }) as HTMLInputElement;

describe("Input", () => {
	it("renders a text box carrying the input slot", () => {
		render(<Input aria-label="Email" />);

		expect(field().dataset.slot).toBe("input");
	});

	it("passes the type through, so an email field gets an email keyboard", () => {
		render(<Input type="email" aria-label="Email" />);

		expect(field().getAttribute("type")).toBe("email");
	});

	it("reports what is typed, keystroke by keystroke", async () => {
		const onChange = vi.fn();
		render(<Input aria-label="Email" onChange={onChange} />);

		await userEvent.type(field(), "ab");

		expect(onChange).toHaveBeenCalledTimes(2);
		expect(field().value).toBe("ab");
	});

	it("lets the caller's class win over its own on the same property", () => {
		render(<Input aria-label="Email" className="h-8" />);

		expect(field().className).toContain("h-8");
		expect(field().className).not.toContain("h-11");
	});
});
