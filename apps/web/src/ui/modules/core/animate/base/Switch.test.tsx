import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("motion/react", async () => {
	const { createElement, forwardRef } = await import("react");
	const strip = (props: Record<string, unknown>) => {
		const { whileTap, initial, animate, transition, onTapStart, onTapCancel, onTap, children, ...rest } = props;
		return { rest, children, animate };
	};
	return {
		m: {
			button: forwardRef<HTMLButtonElement, ComponentProps<"button">>((props, ref) => {
				const { rest, children } = strip(props as never);
				return createElement("button", { ref, ...rest }, children as never);
			}),
			div: forwardRef<HTMLDivElement, ComponentProps<"div">>((props, ref) => {
				const { rest, children } = strip(props as never);
				return createElement("div", { ref, ...rest }, children as never);
			}),
		},
	};
});

const { Switch } = await import("./Switch");

const control = () => screen.getByRole("switch", { name: "Allow past days" });
const thumb = () => document.querySelector('[data-slot="switch-thumb"]');

describe("Switch", () => {
	it("runs uncontrolled off defaultChecked and reports the flip", () => {
		const onCheckedChange = vi.fn();
		render(<Switch defaultChecked onCheckedChange={onCheckedChange} aria-label="Allow past days" />);

		expect(control().getAttribute("aria-checked")).toBe("true");

		fireEvent.click(control());

		expect(onCheckedChange).toHaveBeenCalledWith(false, expect.anything());
		expect(control().getAttribute("aria-checked")).toBe("false");
	});

	it("stays where the caller put it once checked is supplied, and still reports the intent", () => {
		const onCheckedChange = vi.fn();
		render(<Switch checked={false} onCheckedChange={onCheckedChange} aria-label="Allow past days" />);

		fireEvent.click(control());

		expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
		expect(control().getAttribute("aria-checked")).toBe("false");
	});

	it("renders a thumb without being asked, because every call site wants one", () => {
		render(<Switch aria-label="Allow past days" />);

		expect(thumb()).not.toBeNull();
	});

	it("lets a caller replace the thumb rather than adding to it", () => {
		render(
			<Switch aria-label="Allow past days">
				<span data-testid="custom" />
			</Switch>,
		);

		expect(screen.getByTestId("custom")).toBeDefined();
		expect(thumb()).toBeNull();
	});
});
