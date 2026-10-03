import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Bone } from "./Bone";

describe("Bone", () => {
	it("draws an empty block, with nothing to press or read, since it only holds a place", () => {
		const { container } = render(<Bone className="h-4 w-20" />);
		const block = container.firstElementChild as HTMLElement;

		expect(container.children).toHaveLength(1);
		expect(block.children).toHaveLength(0);
		expect(container.textContent).toBe("");
		expect(container.querySelectorAll("button, a, input, [tabindex]")).toHaveLength(0);
	});

	it("keeps its frame and fill whatever size the caller gives it", () => {
		const { container } = render(<Bone className="h-4 w-20" />);
		const classes = (container.firstElementChild as HTMLElement).className.split(" ");

		expect(classes).toEqual(expect.arrayContaining(["border-[2px]", "bg-[var(--surface-panel-soft)]", "h-4", "w-20"]));
	});

	it("lets a caller's radius replace its own, so one block carries one radius", () => {
		const { container } = render(<Bone className="h-5 w-16 rounded-full" />);
		const classes = (container.firstElementChild as HTMLElement).className.split(" ");

		expect(classes).toContain("rounded-full");
		expect(classes).not.toContain("rounded-[8px]");
	});
});
