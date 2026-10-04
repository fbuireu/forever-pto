import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StripeLoadingFixture } from "./StripeLoadingFixture";

describe("StripeLoadingFixture", () => {
	it("holds the place of the checkout's Back and its payment form, and says it is busy", () => {
		const { container } = render(<StripeLoadingFixture />);
		const [back, form] = [...(container.firstElementChild?.children ?? [])];

		expect(container.firstElementChild?.getAttribute("aria-busy")).toBe("true");
		expect(back?.className).toContain("h-9");
		expect(form?.className).toContain("h-48");
	});

	it("says nothing and carries no control, since the checkout it stands in for has not mounted", () => {
		const { container } = render(<StripeLoadingFixture />);

		expect(container.textContent).toBe("");
		expect(container.querySelector("button, a, input")).toBeNull();
	});
});
