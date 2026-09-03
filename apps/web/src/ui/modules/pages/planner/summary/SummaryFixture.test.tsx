import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryFixture } from "./SummaryFixture";

const CHARTS = 4;
const METRIC_CARDS = 4;
const COMPACT_CARDS = 6;
const YEAR_SUMMARY_COLUMNS = 3;

describe("SummaryFixture", () => {
	it("offers nothing to press or read, since it only holds the summary's place", () => {
		const { container } = render(<SummaryFixture />);

		expect(container.querySelectorAll("button, a, input")).toHaveLength(0);
		expect(container.textContent).toBe("");
	});

	it("blocks out the four charts, the four metric cards and the six compact ones the summary renders", () => {
		const { container } = render(<SummaryFixture />);

		expect(container.querySelectorAll(".h-64")).toHaveLength(CHARTS);
		expect(container.querySelectorAll(".md\\:grid-cols-4:not(.lg\\:grid-cols-6) > div")).toHaveLength(METRIC_CARDS);
		expect(container.querySelectorAll(".lg\\:grid-cols-6 > div")).toHaveLength(COMPACT_CARDS);
	});

	it("blocks out the year summary's three columns and its bonus-days total beneath them", () => {
		const { container } = render(<SummaryFixture />);

		expect(container.querySelectorAll(".grid-cols-3 > div")).toHaveLength(YEAR_SUMMARY_COLUMNS);
		expect(container.querySelector(".grid-cols-3 + .text-center")).not.toBeNull();
	});
});
