import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const openDonatePopover = vi.fn();

vi.mock("@application/stores/ui", () => ({
	useUIStore: (selector: (state: { openDonatePopover: (source: string) => void }) => unknown) =>
		selector({ openDonatePopover }),
	DonateSource: { PRICING: "pricing" },
}));

import { SupportButton } from "./SupportButton";

describe("SupportButton", () => {
	it("opens the donation popover through the ui store, which owns whether it is open", () => {
		render(<SupportButton source="pricing" label="Support the project" />);

		fireEvent.click(screen.getByRole("button", { name: "Support the project" }));

		expect(openDonatePopover).toHaveBeenCalledExactlyOnceWith("pricing");
	});

	it("carries the caller's classes onto the button it renders", () => {
		render(<SupportButton source="pricing" label="Support" className="w-full" />);

		expect(screen.getByRole("button", { name: "Support" }).className).toContain("w-full");
	});
});
