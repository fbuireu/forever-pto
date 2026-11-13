import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PremiumLock } from "./PremiumLock";

describe("PremiumLock", () => {
	it("is a picture only, hidden from assistive technology and out of the tab order", () => {
		const { container } = render(<PremiumLock />);
		const lock = container.querySelector('[data-slot="premium-lock"]');

		expect(lock?.getAttribute("aria-hidden")).toBe("true");
		expect(container.querySelector("button, a, [tabindex], [role]")).toBeNull();
	});

	it("takes the padding and icon size its caller gives", () => {
		const { container } = render(<PremiumLock className="p-1" iconSize="size-4" />);

		expect(container.querySelector('[data-slot="premium-lock"]')?.className).toContain("p-1");
		expect(container.querySelector("svg")?.getAttribute("class")).toContain("size-4");
	});
});
