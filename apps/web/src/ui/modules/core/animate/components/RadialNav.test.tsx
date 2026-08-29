import { fireEvent, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

type MotionDivProps = ComponentProps<"div"> & {
	initial?: unknown;
	animate?: unknown;
	transition?: unknown;
	style?: Record<string, unknown>;
};

type MotionButtonProps = ComponentProps<"button"> & {
	initial?: unknown;
	animate?: unknown;
	transition?: unknown;
	variants?: unknown;
	whileTap?: unknown;
};

type MotionSpanProps = ComponentProps<"span"> & {
	variants?: unknown;
	transition?: unknown;
};

vi.mock("motion/react", async () => {
	const { createElement } = await import("react");
	return {
		m: {
			div: ({ children, initial: _i, animate: _a, transition: _t, style, ...props }: MotionDivProps) =>
				createElement("div", { style, ...props }, children),
			button: ({
				children,
				initial: _i,
				animate: _a,
				transition: _t,
				variants: _v,
				whileTap: _wt,
				style,
				...props
			}: MotionButtonProps) => createElement("button", { style, ...props }, children),
			span: ({ children, variants: _v, transition: _t, ...props }: MotionSpanProps) =>
				createElement("span", props, children),
		},
	};
});

vi.mock("lucide-react", () => ({
	MousePointer2: () => null,
}));

import { RadialNav } from "./RadialNav";

const MockIcon = () => <svg />;

const ITEMS = [
	{ id: 1, icon: MockIcon, label: "Item 1", angle: 0 },
	{ id: 2, icon: MockIcon, label: "Item 2", angle: 120 },
	{ id: 3, icon: MockIcon, label: "Item 3", angle: 240 },
];

describe("RadialNav", () => {
	it("renders without throwing", () => {
		expect(() => render(<RadialNav items={ITEMS} />)).not.toThrow();
	});

	it("is a named group, not a menu it never implemented", () => {
		const { getByRole, queryByRole } = render(<RadialNav items={ITEMS} aria-label="Feature navigation" />);
		expect(getByRole("group", { name: "Feature navigation" })).toBeTruthy();
		expect(queryByRole("menu")).toBeNull();
		expect(queryByRole("menuitem")).toBeNull();
	});

	it("renders a button for each item", () => {
		const { getAllByRole } = render(<RadialNav items={ITEMS} />);
		expect(getAllByRole("button")).toHaveLength(3);
	});

	it("renders each item with its aria-label", () => {
		const { getByRole } = render(<RadialNav items={ITEMS} />);
		expect(getByRole("button", { name: "Item 1" })).toBeTruthy();
		expect(getByRole("button", { name: "Item 2" })).toBeTruthy();
		expect(getByRole("button", { name: "Item 3" })).toBeTruthy();
	});

	it("calls onActiveChange with the item id when clicked", () => {
		const onActiveChange = vi.fn();
		const { getByRole } = render(<RadialNav items={ITEMS} onActiveChange={onActiveChange} />);
		fireEvent.click(getByRole("button", { name: "Item 2" }));
		expect(onActiveChange).toHaveBeenCalledWith(2);
	});

	it("marks the defaultActiveId item as active", () => {
		const { getByRole } = render(<RadialNav items={ITEMS} defaultActiveId={1} />);
		expect(getByRole("button", { name: "Item 1" }).className).toContain("bg-accent");
	});

	it("does not mark any item as active when defaultActiveId is not set", () => {
		const { getAllByRole } = render(<RadialNav items={ITEMS} />);
		for (const btn of getAllByRole("button")) {
			expect(btn.className).not.toContain("bg-accent");
		}
	});

	it("activates the clicked item", () => {
		const { getByRole } = render(<RadialNav items={ITEMS} />);
		fireEvent.click(getByRole("button", { name: "Item 3" }));
		expect(getByRole("button", { name: "Item 3" }).className).toContain("bg-accent");
	});

	it("deactivates the previous item after clicking another", () => {
		const { getByRole } = render(<RadialNav items={ITEMS} defaultActiveId={1} />);
		fireEvent.click(getByRole("button", { name: "Item 2" }));
		expect(getByRole("button", { name: "Item 1" }).className).not.toContain("bg-accent");
		expect(getByRole("button", { name: "Item 2" }).className).toContain("bg-accent");
	});

	it("says which item is selected, rather than only colouring it", () => {
		const { getByRole } = render(<RadialNav items={ITEMS} defaultActiveId={1} />);

		expect(getByRole("button", { name: "Item 1" }).getAttribute("aria-pressed")).toBe("true");
		expect(getByRole("button", { name: "Item 2" }).getAttribute("aria-pressed")).toBe("false");
	});

	it("moves the selected state with the click", () => {
		const { getByRole } = render(<RadialNav items={ITEMS} defaultActiveId={1} />);

		fireEvent.click(getByRole("button", { name: "Item 3" }));

		expect(getByRole("button", { name: "Item 1" }).getAttribute("aria-pressed")).toBe("false");
		expect(getByRole("button", { name: "Item 3" }).getAttribute("aria-pressed")).toBe("true");
	});
});
