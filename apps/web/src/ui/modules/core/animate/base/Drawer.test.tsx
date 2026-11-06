import { render } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("vaul", () => ({
	Drawer: {
		Root: ({ children, ...props }: ComponentProps<"div">) => <div {...props}>{children}</div>,
		Portal: ({ children }: { children: ReactNode }) => <>{children}</>,
		Content: ({ children, ...props }: ComponentProps<"div">) => <div {...props}>{children}</div>,
		Handle: (props: ComponentProps<"div">) => <div {...props} />,
		Title: ({ children, className, ...props }: ComponentProps<"div">) => (
			<div className={className} {...props}>
				{children}
			</div>
		),
	},
}));

import { Drawer, DrawerContent, DrawerTitle } from "./Drawer";

describe("Drawer", () => {
	it('renders with data-slot="drawer"', () => {
		const { container } = render(
			<Drawer>
				<span />
			</Drawer>,
		);
		expect(container.querySelector('[data-slot="drawer"]')).not.toBeNull();
	});
});

describe("DrawerContent", () => {
	it("draws no overlay behind the sheet, because the planner stays usable around it", () => {
		const { container } = render(<DrawerContent />);
		expect(container.querySelector('[data-slot="drawer-overlay"]')).toBeNull();
	});

	it('renders with data-slot="drawer-content"', () => {
		const { container } = render(<DrawerContent />);
		expect(container.querySelector('[data-slot="drawer-content"]')).not.toBeNull();
	});
});

describe("DrawerTitle", () => {
	it("applies sr-only class by default", () => {
		const { container } = render(<DrawerTitle>title</DrawerTitle>);
		expect(container.firstElementChild?.className).toContain("sr-only");
	});

	it("accepts and merges additional className", () => {
		const { container } = render(<DrawerTitle className="extra">title</DrawerTitle>);
		expect(container.firstElementChild?.className).toContain("sr-only");
		expect(container.firstElementChild?.className).toContain("extra");
	});
});
