import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "./loading";

describe("payment/confirmation/loading", () => {
	it("shows a spinner that assistive technology skips, since the page announces the outcome itself", () => {
		const { container } = render(<Loading />);
		const spinner = container.querySelector("svg");

		expect(spinner?.getAttribute("aria-hidden")).toBe("true");
		expect(spinner?.getAttribute("class")).toContain("animate-spin");
	});

	it("says nothing in text while the confirmation is pending", () => {
		const { container } = render(<Loading />);

		expect(container.textContent).toBe("");
	});
});
