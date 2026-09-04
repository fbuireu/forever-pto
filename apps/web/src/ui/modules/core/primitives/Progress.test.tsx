import { render, screen } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

type MotionProps = Record<string, unknown> & { initial?: unknown; animate?: unknown; transition?: unknown };

vi.mock("motion/react", async () => {
	const { createElement } = await import("react");
	const stamp = ({ initial: _i, animate, transition: _t, ...props }: MotionProps) => ({
		...props,
		"data-animate": JSON.stringify(animate),
	});
	return {
		m: {
			create: (Component: ComponentType<Record<string, unknown>>) => (props: MotionProps) =>
				createElement(Component, stamp(props)),
			span: ({ children, ...props }: MotionProps & { children?: ReactNode }) =>
				createElement("span", stamp(props), children),
		},
	};
});

import { Progress, ProgressOverlayLabel, ProgressTrack } from "./Progress";

const animateOf = (element: Element | null) =>
	JSON.parse(element?.getAttribute("data-animate") ?? "null") as Record<string, string> | null;

const renderProgress = (value: number | null = null) =>
	render(
		<Progress value={value} aria-label="Plan progress">
			<div className="relative">
				<ProgressTrack />
				<ProgressOverlayLabel>{value}%</ProgressOverlayLabel>
			</div>
		</Progress>,
	);

const indicator = (container: HTMLElement) => container.querySelector('[data-slot="progress-indicator"]');
const overlay = (container: HTMLElement) => container.querySelector("span[aria-hidden]");

describe("Progress", () => {
	it("exposes the value as a progressbar", () => {
		renderProgress(40);

		expect(screen.getByRole("progressbar", { name: "Plan progress" }).getAttribute("aria-valuenow")).toBe("40");
	});

	it("drives the indicator to the value as a width", () => {
		const { container } = renderProgress(40);

		expect(animateOf(indicator(container))).toEqual({ width: "40%" });
	});

	it("treats a missing value as an empty track rather than a broken one", () => {
		const { container } = renderProgress();

		expect(animateOf(indicator(container))).toEqual({ width: "0%" });
	});

	it("clips the overlay label to the filled part, so the text flips colour as the bar passes it", () => {
		const { container } = renderProgress(40);

		expect(animateOf(overlay(container))).toEqual({ clipPath: "inset(0 60% 0 0)" });
	});

	it("never clips past the ends for a value beyond the range", () => {
		const { container } = renderProgress(150);

		expect(animateOf(overlay(container))).toEqual({ clipPath: "inset(0 0% 0 0)" });
	});

	it("renders the label twice, once readable and once decorative", () => {
		renderProgress(40);

		const labels = screen.getAllByText("40%");
		expect(labels).toHaveLength(2);
		expect(labels.filter((label) => label.getAttribute("aria-hidden") === "true")).toHaveLength(1);
	});

	it("refuses a track outside Progress, since it has no value to draw", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => render(<ProgressTrack />)).toThrow("useContext must be used within ProgressContext");

		error.mockRestore();
	});
});
