import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlannerPanelFixture } from "./PlannerPanelFixture";

describe("PlannerPanelFixture", () => {
	it("offers nothing to press or read, since it only holds the panel's place", () => {
		const { container } = render(<PlannerPanelFixture />);

		expect(container.querySelectorAll("button, a, input")).toHaveLength(0);
		expect(container.textContent).toBe("");
	});

	it("keeps the two month arrows so the skeleton has the panel's silhouette", () => {
		const { container } = render(<PlannerPanelFixture />);

		expect(container.querySelectorAll("svg")).toHaveLength(2);
	});

	it("blocks out the same three rows the panel has: the switcher, the counters and the two bars", () => {
		const { container } = render(<PlannerPanelFixture />);

		expect(container.querySelectorAll(".rounded-full")).toHaveLength(5);
		expect(container.querySelectorAll(".h-\\[22px\\]")).toHaveLength(2);
	});
});
