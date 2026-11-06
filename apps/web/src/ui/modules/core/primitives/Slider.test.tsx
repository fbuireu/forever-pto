import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "./Slider";

const control = (): HTMLInputElement => screen.getByRole("slider", { name: "PTO days" }) as HTMLInputElement;

describe("Slider", () => {
	it("names the real control, the range input under the thumb, with the label", () => {
		render(<Slider label="PTO days" value={[5]} min={0} max={100} step={1} onValueChange={vi.fn()} />);

		expect(control().tagName).toBe("INPUT");
		expect(control().getAttribute("type")).toBe("range");
	});

	it("hands the bounds and the step to the control", () => {
		render(<Slider label="PTO days" value={[5]} min={1} max={30} step={5} onValueChange={vi.fn()} />);

		expect(control().min).toBe("1");
		expect(control().max).toBe("30");
		expect(control().step).toBe("5");
		expect(control().value).toBe("5");
	});

	it("hands the caller an array, so one shape serves a single value and a range", () => {
		const onValueChange = vi.fn();
		render(<Slider label="PTO days" value={[5]} min={0} max={100} step={1} onValueChange={onValueChange} />);

		fireEvent.change(control(), { target: { value: "7" } });

		expect(onValueChange).toHaveBeenLastCalledWith([7]);
	});

	it("follows the value it is given rather than its own", () => {
		const { rerender } = render(
			<Slider label="PTO days" value={[3]} min={0} max={100} step={1} onValueChange={vi.fn()} />,
		);
		expect(control().value).toBe("3");

		rerender(<Slider label="PTO days" value={[9]} min={0} max={100} step={1} onValueChange={vi.fn()} />);

		expect(control().value).toBe("9");
	});
});
