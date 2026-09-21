import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ui = vi.hoisted(() => ({ openQuickStart: vi.fn() }));

vi.mock("@application/stores/ui", () => ({
	useUIStore: (selector: (state: typeof ui) => unknown) => selector(ui),
}));

import { QuickStartTrigger } from "./QuickStartTrigger";

beforeEach(() => {
	ui.openQuickStart.mockClear();
});

describe("QuickStartTrigger", () => {
	it("renders a button that announces the dialog it opens", () => {
		render(<QuickStartTrigger>Try it</QuickStartTrigger>);
		const button = screen.getByRole("button", { name: "Try it" });

		expect(button.getAttribute("type")).toBe("button");
		expect(button.getAttribute("aria-haspopup")).toBe("dialog");
	});

	it("opens the quick start on click", () => {
		render(<QuickStartTrigger>Try it</QuickStartTrigger>);

		fireEvent.click(screen.getByRole("button", { name: "Try it" }));

		expect(ui.openQuickStart).toHaveBeenCalledTimes(1);
	});

	it("passes the class it is handed through to the button", () => {
		render(<QuickStartTrigger className="w-full">Try it</QuickStartTrigger>);

		expect(screen.getByRole("button", { name: "Try it" }).className).toContain("w-full");
	});
});
