import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "./Slider";

const control = () => screen.getByRole("slider", { name: "PTO days" }) as HTMLInputElement;

describe("Slider", () => {
	it("names the real control, the range input under the thumb, with the label", () => {
		render(<Slider label="PTO days" defaultValue={5} />);

		expect(control().tagName).toBe("INPUT");
		expect(control().getAttribute("type")).toBe("range");
	});

	it("hands the bounds and the step to the control", () => {
		render(<Slider label="PTO days" defaultValue={5} min={1} max={30} step={5} />);

		expect(control().min).toBe("1");
		expect(control().max).toBe("30");
		expect(control().step).toBe("5");
		expect(control().value).toBe("5");
	});

	it("hands the caller an array even for a single thumb, so one shape serves a single value and a range", () => {
		const onValueChange = vi.fn();
		render(<Slider label="PTO days" defaultValue={5} onValueChange={onValueChange} />);

		fireEvent.change(control(), { target: { value: "7" } });

		expect(onValueChange).toHaveBeenLastCalledWith([7]);
	});

	it("reports the committed value in the same array shape", () => {
		const onValueCommitted = vi.fn();
		render(<Slider label="PTO days" defaultValue={5} onValueCommitted={onValueCommitted} />);

		fireEvent.change(control(), { target: { value: "7" } });

		expect(onValueCommitted).toHaveBeenLastCalledWith([7]);
	});

	it("follows a controlled value rather than its own", () => {
		const { rerender } = render(<Slider label="PTO days" value={3} />);
		expect(control().value).toBe("3");

		rerender(<Slider label="PTO days" value={9} />);

		expect(control().value).toBe("9");
	});

	it("passes disabled to the control so it cannot be moved", () => {
		render(<Slider label="PTO days" defaultValue={5} disabled />);

		expect(control().disabled).toBe(true);
	});

	it("merges the caller's className onto the root", () => {
		const { container } = render(<Slider label="PTO days" defaultValue={5} className="w-64" />);

		expect((container.firstElementChild as HTMLElement).className).toContain("w-64");
	});
});
