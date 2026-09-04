import { fireEvent, render, screen } from "@testing-library/react";
import { m } from "motion/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { MotionSlot } from "./MotionSlot";

describe("MotionSlot", () => {
	it("renders the child's own element as the motion element rather than wrapping it", () => {
		const { container } = render(
			<MotionSlot>
				<button type="button">Tap</button>
			</MotionSlot>,
		);

		expect(container.children).toHaveLength(1);
		expect(container.firstElementChild?.tagName).toBe("BUTTON");
	});

	it("merges its className with the child's instead of replacing either", () => {
		render(
			<MotionSlot className="slot">
				<button type="button" className="child">
					Tap
				</button>
			</MotionSlot>,
		);

		const button = screen.getByRole("button", { name: "Tap" });
		expect(button.className).toContain("slot");
		expect(button.className).toContain("child");
	});

	it("merges style the same way, its own keys winning", () => {
		render(
			<MotionSlot style={{ color: "red" }}>
				<span data-testid="styled" style={{ color: "blue", padding: 2 }} />
			</MotionSlot>,
		);

		const styled = screen.getByTestId("styled");
		expect(styled.style.color).toBe("red");
		expect(styled.style.padding).toBe("2px");
	});

	it("keeps the child's handlers beside the ones it adds", () => {
		const onClick = vi.fn();
		const onPointerEnter = vi.fn();
		render(
			<MotionSlot onPointerEnter={onPointerEnter}>
				<button type="button" onClick={onClick}>
					Tap
				</button>
			</MotionSlot>,
		);

		const button = screen.getByRole("button", { name: "Tap" });
		fireEvent.click(button);
		fireEvent.pointerEnter(button);

		expect(onClick).toHaveBeenCalledOnce();
		expect(onPointerEnter).toHaveBeenCalledOnce();
	});

	it("hands the child's ref and its own the same node", () => {
		const slotRef = createRef<HTMLDivElement>();
		const childRef = vi.fn();
		render(
			<MotionSlot ref={slotRef}>
				<div ref={childRef} data-testid="box" />
			</MotionSlot>,
		);

		expect(slotRef.current).toBe(screen.getByTestId("box"));
		expect(childRef).toHaveBeenCalledWith(screen.getByTestId("box"));
	});

	it("skips a ref the child does not carry rather than failing on it", () => {
		const slotRef = vi.fn();
		render(
			<MotionSlot ref={slotRef}>
				<div data-testid="box" />
			</MotionSlot>,
		);

		expect(slotRef).toHaveBeenCalledWith(screen.getByTestId("box"));
	});

	it("adopts a child that is already a motion element instead of wrapping it a second time", () => {
		render(
			<MotionSlot className="slot">
				<m.div data-testid="already" className="child" />
			</MotionSlot>,
		);

		const already = screen.getByTestId("already");
		expect(already.className).toContain("slot");
		expect(already.className).toContain("child");
	});
});
