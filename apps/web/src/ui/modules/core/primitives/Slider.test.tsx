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

	describe("the track, split around the handle", () => {
		interface SegmentsParams {
			value: number;
			min?: number;
			max?: number;
		}

		const segments = ({ value, min = 0, max = 10 }: SegmentsParams) => {
			const { container } = render(
				<Slider label="PTO days" value={[value]} min={min} max={max} step={1} onValueChange={vi.fn()} />,
			);
			const range = container.querySelector<HTMLElement>('[data-slot="slider-range"]');
			const rest = container.querySelector<HTMLElement>('[data-slot="slider-rest"]');
			if (!range || !rest) throw new Error("the slider drew no track segments");
			return { range: range.getAttribute("style"), rest: rest.getAttribute("style") };
		};

		it("ends the fill and starts the rest a clearance either side of the value", () => {
			const { range, rest } = segments({ value: 5 });

			expect(range).toContain("calc(50% + 8px)");
			expect(rest).toContain("calc(50% + 8px)");
		});

		it("pins the fill from both ends, so at the minimum its insets cross and it draws nothing", () => {
			expect(segments({ value: 0 }).range).toContain("calc(100% + 8px)");
			expect(segments({ value: 10 }).rest).toContain("calc(100% + 8px)");
		});

		it("measures the value against its own bounds", () => {
			expect(segments({ value: 3, min: 1, max: 5 }).rest).toContain("calc(50% + 8px)");
		});

		it("clamps a value outside the bounds and survives a range with no span", () => {
			expect(segments({ value: 20 }).rest).toContain("calc(100% + 8px)");
			expect(segments({ value: 4, min: 4, max: 4 }).rest).toContain("calc(0% + 8px)");
		});
	});
});
