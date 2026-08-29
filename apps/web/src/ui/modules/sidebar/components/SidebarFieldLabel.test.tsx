import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SidebarFieldLabel, SidebarFieldTooltip } from "./SidebarFieldLabel";

describe("SidebarFieldLabel", () => {
	it("associates the label with the control the caller named", () => {
		render(
			<>
				<SidebarFieldLabel controlId="allow-past-days" icon={null} title="Allow past days" />
				<button type="button" id="allow-past-days" role="switch" aria-checked="false" />
			</>,
		);

		expect(screen.getByRole("switch", { name: "Allow past days" })).toBe(document.getElementById("allow-past-days"));
	});

	it("renders no label element when there is no control to name", () => {
		const { container } = render(<SidebarFieldLabel icon={null} title="Status" />);

		expect(container.querySelector("label")).toBeNull();
		expect(screen.getByText("Status")).toBeTruthy();
	});

	it("leaves the tooltip out entirely when the field has none", () => {
		render(<SidebarFieldLabel controlId="years" icon={null} title="Year" />);

		expect(screen.queryByRole("button")).toBeNull();
	});
});

describe("SidebarFieldTooltip", () => {
	it("names its trigger for a screen reader, since the trigger renders as an icon", () => {
		render(<SidebarFieldTooltip label="What this does">Some explanation</SidebarFieldTooltip>);

		expect(screen.getByLabelText("What this does")).toBeTruthy();
	});
});
