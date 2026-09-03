import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpressCheckoutFixture } from "./ExpressCheckoutFixture";

describe("ExpressCheckoutFixture", () => {
	it("reserves two equal slots of the wallet buttons' height, so the real ones land without a shift", () => {
		const { container } = render(<ExpressCheckoutFixture />);
		const slots = [...(container.firstElementChild?.children ?? [])];

		expect(slots).toHaveLength(2);
		expect(slots.every((slot) => slot.className.includes("h-12") && slot.className.includes("flex-1"))).toBe(true);
	});

	it("says nothing, since it stands in for controls that have not loaded", () => {
		const { container } = render(<ExpressCheckoutFixture />);

		expect(container.textContent).toBe("");
	});
});
