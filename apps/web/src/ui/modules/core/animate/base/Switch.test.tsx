import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("motion/react", async () => {
	const { createElement, forwardRef } = await import("react");
	const strip = (props: Record<string, unknown>) => {
		const { whileTap, initial, animate, transition, children, ...rest } = props;
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

const control = (): HTMLElement => screen.getByRole("switch", { name: "Allow past days" });
const thumb = (): Element | null => document.querySelector('[data-slot="switch-thumb"]');

describe("Switch", () => {
	it("stays where the caller put it, and reports the intent", () => {
		const onCheckedChange = vi.fn();
		render(<Switch checked={false} onCheckedChange={onCheckedChange} aria-label="Allow past days" />);

		fireEvent.click(control());

		expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
		expect(control().getAttribute("aria-checked")).toBe("false");
	});

	it("shows the state it was given", () => {
		render(<Switch checked onCheckedChange={vi.fn()} aria-label="Allow past days" />);

		expect(control().getAttribute("aria-checked")).toBe("true");
	});

	it("names itself through an id a visible label points at", () => {
		render(<Switch checked={false} onCheckedChange={vi.fn()} id="allow-past-days" />);

		expect(document.querySelector("#allow-past-days")).not.toBeNull();
	});

	it("does not react to a click while disabled", () => {
		const onCheckedChange = vi.fn();
		render(<Switch checked={false} onCheckedChange={onCheckedChange} disabled aria-label="Allow past days" />);

		fireEvent.click(control());

		expect(onCheckedChange).not.toHaveBeenCalled();
	});

	it("renders a thumb, because every call site wants one", () => {
		render(<Switch checked={false} onCheckedChange={vi.fn()} aria-label="Allow past days" />);

		expect(thumb()).not.toBeNull();
	});
});
