import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "./Separator";

describe("Separator", () => {
	it("is decorative by default: no separator role and no orientation for a reader to announce", () => {
		const { container } = render(<Separator />);

		const rule = container.firstElementChild as HTMLElement;
		expect(rule.getAttribute("role")).toBe("none");
		expect(rule.getAttribute("aria-orientation")).toBeNull();
		expect(rule.className).toContain("h-px w-full");
	});

	it("becomes a real separator carrying its orientation once it is not decorative", () => {
		render(<Separator decorative={false} orientation="vertical" />);

		const rule = screen.getByRole("separator");
		expect(rule.getAttribute("aria-orientation")).toBe("vertical");
		expect(rule.className).toContain("h-full w-px");
	});

	it("announces horizontal when semantic and left horizontal", () => {
		render(<Separator decorative={false} />);

		expect(screen.getByRole("separator").getAttribute("aria-orientation")).toBe("horizontal");
	});

	it("lays out vertically without becoming semantic", () => {
		const { container } = render(<Separator orientation="vertical" />);

		const rule = container.firstElementChild as HTMLElement;
		expect(rule.getAttribute("role")).toBe("none");
		expect(rule.className).toContain("h-full w-px");
	});

	it("merges the caller's className", () => {
		const { container } = render(<Separator className="my-4" />);

		expect((container.firstElementChild as HTMLElement).className).toContain("my-4");
	});
});
