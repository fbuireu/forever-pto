import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@ui/modules/core/animate/base/Popover", () => ({
	Popover: ({ children }: { children?: ReactNode }) => <div data-primitive="popover">{children}</div>,
	PopoverTrigger: ({ children }: { children?: ReactNode }) => <div data-primitive="popover-trigger">{children}</div>,
	PopoverContent: ({
		children,
		className,
		collisionAvoidance,
		...props
	}: ComponentProps<"div"> & { collisionAvoidance?: { side: string; fallbackAxisSide: string } }) => (
		<div
			data-primitive="popover-content"
			className={className}
			data-side-mode={collisionAvoidance?.side}
			data-fallback-axis={collisionAvoidance?.fallbackAxisSide}
			{...props}
		>
			{children}
		</div>
	),
}));

import { Combobox } from "./Combobox";

const COUNTRIES = [
	{ value: "ES", label: "Spain", flag: "es" },
	{ value: "FR", label: "France", flag: "fr" },
];

const COLLIDING_REGIONS = [
	{ value: "r1", label: "Same Label" },
	{ value: "r2", label: "Same Label" },
];

describe("Combobox", () => {
	it("sizes the list to the control it opens from and to the room under it, rather than a fixed width", () => {
		const { container } = render(<Combobox options={COUNTRIES} onChange={vi.fn()} />);
		const panel = container.querySelector('[data-primitive="popover-content"]')?.className ?? "";

		expect(panel).toContain("w-(--anchor-width)");
		expect(panel).toContain("max-h-(--available-height)");
		expect(panel).not.toMatch(/(^| )w-\[200px\]/);
	});

	it("flips above the control when the room under it runs out, but never jumps to its side", () => {
		const { container } = render(<Combobox options={COUNTRIES} onChange={vi.fn()} />);
		const panel = container.querySelector<HTMLElement>('[data-primitive="popover-content"]');

		expect(panel?.dataset.sideMode).toBe("flip");
		expect(panel?.dataset.fallbackAxis).toBe("none");
	});

	it("hands back the option that was clicked, keyed by value rather than by label", async () => {
		const onChange = vi.fn();
		render(<Combobox options={COLLIDING_REGIONS} value="" onChange={onChange} />);

		await userEvent.click(screen.getAllByRole("option")[1]);

		expect(onChange).toHaveBeenCalledExactlyOnceWith("r2");
	});

	it("hands back the option value unchanged rather than lower-casing it", async () => {
		const onChange = vi.fn();
		render(<Combobox options={COUNTRIES} value="" onChange={onChange} />);

		await userEvent.click(screen.getAllByRole("option")[0]);

		expect(onChange).toHaveBeenCalledExactlyOnceWith("ES");
	});

	it("does not fire onChange when the clicked option is already the selected one, whatever its casing", async () => {
		const onChange = vi.fn();
		render(<Combobox options={COUNTRIES} value="es" onChange={onChange} />);

		await userEvent.click(screen.getAllByRole("option")[0]);

		expect(onChange).not.toHaveBeenCalled();
	});

	it("still filters on the option label once the item is keyed by value", async () => {
		render(<Combobox options={COUNTRIES} value="" onChange={vi.fn()} searchPlaceholder="Search" />);

		await userEvent.type(screen.getByPlaceholderText("Search"), "Spain");

		expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Spain"]);
	});

	it("renders no element carrying the hard-coded combobox-listbox id", () => {
		const { container } = render(<Combobox options={COUNTRIES} value="" onChange={vi.fn()} />);

		expect(container.ownerDocument.getElementById("combobox-listbox")).toBeNull();
	});
});
