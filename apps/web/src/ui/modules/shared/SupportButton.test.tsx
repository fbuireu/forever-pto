import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const openDonatePopover = vi.fn();

vi.mock("@application/stores/ui", () => ({
	useUIStore: (selector: (state: { openDonatePopover: () => void }) => unknown) => selector({ openDonatePopover }),
}));

import { SupportButton } from "./SupportButton";

describe("SupportButton", () => {
	it("opens the donation popover through the ui store, which owns whether it is open", () => {
		render(<SupportButton label="Support the project" />);

		fireEvent.click(screen.getByRole("button", { name: "Support the project" }));

		expect(openDonatePopover).toHaveBeenCalledOnce();
	});

	it("carries the caller's classes onto the button it renders", () => {
		render(<SupportButton label="Support" className="w-full" />);

		expect(screen.getByRole("button", { name: "Support" }).className).toContain("w-full");
	});
});
