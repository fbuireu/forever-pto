import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonVariants } from "./Button";

describe("Button", () => {
	it("renders a real button carrying the slot and the default variant and size", () => {
		render(<Button>Plan</Button>);

		const button = screen.getByRole("button", { name: "Plan" });
		expect(button.dataset.slot).toBe("button");
		expect(button.className).toContain("bg-primary");
		expect(button.className).toContain("h-11");
	});

	it("swaps variant and size classes independently of each other", () => {
		render(
			<Button variant="ghost" size="icon-sm">
				Menu
			</Button>,
		);

		const button = screen.getByRole("button", { name: "Menu" });
		expect(button.className).toContain("border-transparent");
		expect(button.className).toContain("size-9");
		expect(button.className).not.toContain("bg-primary");
	});

	it("reports a click to the caller", async () => {
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Go</Button>);

		await userEvent.click(screen.getByRole("button", { name: "Go" }));

		expect(onClick).toHaveBeenCalledOnce();
	});

	it("passes disabled through, so a disabled button neither clicks nor reads as enabled", async () => {
		const onClick = vi.fn();
		render(
			<Button disabled onClick={onClick}>
				Wait
			</Button>,
		);

		const button = screen.getByRole("button", { name: "Wait" }) as HTMLButtonElement;
		expect(button.disabled).toBe(true);

		await userEvent.click(button);

		expect(onClick).not.toHaveBeenCalled();
	});

	it("renders the child in its place when asChild is set, so a link can look like a button without nesting one", () => {
		render(
			<Button asChild variant="link">
				<a href="/planner">Open the planner</a>
			</Button>,
		);

		const link = screen.getByRole("link", { name: "Open the planner" });
		expect(link.dataset.slot).toBe("button");
		expect(link.className).toContain("underline-offset-4");
		expect(screen.queryByRole("button")).toBeNull();
	});

	it("lets the caller's class win over the variant's on the same property", () => {
		render(<Button className="h-8">Short</Button>);

		const button = screen.getByRole("button", { name: "Short" });
		expect(button.className).toContain("h-8");
		expect(button.className).not.toContain("h-11");
	});

	it("exposes buttonVariants so something that is not a Button can be styled as one", () => {
		expect(buttonVariants({ variant: "destructive" })).toContain("bg-destructive");
	});
});
