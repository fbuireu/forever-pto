import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ui = vi.hoisted(() => ({ openQuickStart: vi.fn() }));

vi.mock("@application/stores/ui", () => ({
	useUIStore: (selector: (state: typeof ui) => unknown) => selector(ui),
	QuickStartSource: { HERO: "hero" },
}));

vi.mock("@application/i18n/navigation", () => ({
	Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

import { QuickStartTrigger } from "./QuickStartTrigger";

beforeEach(() => {
	ui.openQuickStart.mockClear();
	localStorage.clear();
});

describe("QuickStartTrigger", () => {
	it("links straight to the planner when a plan is already stored and it has a resume label", () => {
		localStorage.setItem("holidays-store", "{}");
		render(
			<QuickStartTrigger source="hero" resumeLabel="My plan">
				Try it
			</QuickStartTrigger>,
		);

		expect(screen.getByRole("link", { name: "My plan" }).getAttribute("href")).toBe("/planner");
		expect(screen.queryByRole("button", { name: "Try it" })).toBeNull();
	});

	it("keeps opening the quick start when nothing is stored, even with a resume label", () => {
		render(
			<QuickStartTrigger source="hero" resumeLabel="My plan">
				Try it
			</QuickStartTrigger>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Try it" }));

		expect(ui.openQuickStart).toHaveBeenCalledExactlyOnceWith("hero");
		expect(screen.queryByRole("link")).toBeNull();
	});

	it("ignores a stored plan when it has no resume label to offer", () => {
		localStorage.setItem("holidays-store", "{}");
		render(<QuickStartTrigger source="hero">Try it</QuickStartTrigger>);

		expect(screen.getByRole("button", { name: "Try it" })).toBeDefined();
	});

	it("renders a button that announces the dialog it opens", () => {
		render(<QuickStartTrigger source="hero">Try it</QuickStartTrigger>);
		const button = screen.getByRole("button", { name: "Try it" });

		expect(button.getAttribute("type")).toBe("button");
		expect(button.getAttribute("aria-haspopup")).toBe("dialog");
	});

	it("opens the quick start on click, naming the call to action it sits in", () => {
		render(<QuickStartTrigger source="hero">Try it</QuickStartTrigger>);

		fireEvent.click(screen.getByRole("button", { name: "Try it" }));

		expect(ui.openQuickStart).toHaveBeenCalledExactlyOnceWith("hero");
	});

	it("passes the class it is handed through to the button", () => {
		render(
			<QuickStartTrigger source="hero" className="w-full">
				Try it
			</QuickStartTrigger>,
		);

		expect(screen.getByRole("button", { name: "Try it" }).className).toContain("w-full");
	});
});
