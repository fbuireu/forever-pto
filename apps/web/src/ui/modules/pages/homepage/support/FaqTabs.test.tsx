import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FaqTabs } from "./FaqTabs";

const TABS = [
	{ id: "general", title: "General", content: <p>general answers</p> },
	{ id: "security", title: "Security", content: <p>security answers</p> },
];

describe("FaqTabs", () => {
	it("opens on the first section, with only its content on the page", () => {
		render(<FaqTabs tabs={TABS} />);

		expect(screen.getByRole("tab", { selected: true }).textContent).toBe("General");
		expect(screen.getByText("general answers")).toBeDefined();
		expect(screen.queryByText("security answers")).toBeNull();
	});

	it("swaps the content when another tab is chosen", async () => {
		render(<FaqTabs tabs={TABS} />);

		fireEvent.click(screen.getByRole("tab", { name: "Security" }));

		await waitFor(() => expect(screen.getByText("security answers")).toBeDefined());
		expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Security");
	});

	it("gives every section an equal column, however many there are", () => {
		render(<FaqTabs tabs={TABS} />);

		expect(screen.getByRole("tablist").style.gridTemplateColumns).toBe("repeat(2, 1fr)");
	});

	it("renders the heading only when a title is given, under the id the page anchors to", () => {
		const { rerender } = render(<FaqTabs tabs={TABS} />);
		expect(screen.queryByRole("heading", { level: 2 })).toBeNull();

		rerender(<FaqTabs tabs={TABS} title="Questions" />);

		expect(screen.getByRole("heading", { level: 2, name: "Questions" }).id).toBe("faq-title");
	});

	it("survives an empty section list without a tab to select", () => {
		render(<FaqTabs tabs={[]} />);

		expect(screen.queryAllByRole("tab")).toEqual([]);
	});
});
