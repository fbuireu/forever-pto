import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, badgeVariants } from "./Badge";

describe("Badge", () => {
	it("renders a span carrying the badge slot and the default variant", () => {
		render(<Badge>New</Badge>);

		const badge = screen.getByText("New");
		expect(badge.tagName).toBe("SPAN");
		expect(badge.dataset.slot).toBe("badge");
		expect(badge.className).toContain("bg-primary");
	});

	it("swaps the variant classes and keeps the frame every variant shares", () => {
		render(<Badge variant="destructive">Late</Badge>);

		const badge = screen.getByText("Late");
		expect(badge.className).toContain("bg-destructive");
		expect(badge.className).not.toContain("bg-primary");
		expect(badge.className).toContain("border-[3px]");
	});

	it("lets the caller's class win over the variant's on the same property", () => {
		render(<Badge className="bg-red-500">Hot</Badge>);

		const badge = screen.getByText("Hot");
		expect(badge.className).toContain("bg-red-500");
		expect(badge.className).not.toContain("bg-primary");
	});

	it("renders the child itself when asChild is set, so a link can wear the badge", () => {
		render(
			<Badge asChild variant="outline">
				<a href="/premium">Premium</a>
			</Badge>,
		);

		const link = screen.getByRole("link", { name: "Premium" });
		expect(link.dataset.slot).toBe("badge");
		expect(link.className).toContain("rounded-full");
		expect(link.querySelector("span")).toBeNull();
	});

	it("exposes badgeVariants so something that is not a Badge can be styled as one", () => {
		expect(badgeVariants({ variant: "secondary" })).toContain("bg-secondary");
		expect(badgeVariants()).toContain("bg-primary");
	});
});
