import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ComponentType, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface MotionSpanProps extends ComponentProps<"span"> {
	animate?: unknown;
	transition?: unknown;
	initial?: unknown;
	exit?: unknown;
}

interface MotionSlotMockProps extends ComponentProps<"div"> {
	animate?: unknown;
	transition?: unknown;
	children: ReactNode;
}

const inView = vi.hoisted(() => ({ value: false }));

const controls = vi.hoisted(() => ({
	start: vi.fn<(animation: string) => Promise<void>>(),
	set: vi.fn<(animation: string) => void>(),
}));

vi.mock("motion/react", async () => {
	const { createElement } = await import("react");
	return {
		m: {
			span: ({ children, animate: _a, transition: _t, initial: _i, exit: _e, ...props }: MotionSpanProps) =>
				createElement("span", props, children),
		},
		useAnimation: () => controls,
	};
});

vi.mock("@ui/hooks/useIsInView", () => ({
	useIsInView: () => ({ ref: { current: null }, isInView: inView.value }),
}));

vi.mock("../primitives/animate/MotionSlot", async () => {
	const { createElement } = await import("react");
	return {
		MotionSlot: ({ children, animate: _a, transition: _t, ...props }: MotionSlotMockProps) =>
			createElement("div", { "data-slot": "motion-slot", ...props }, children),
	};
});

import { AnimateIcon, type IconProps, IconWrapper, useAnimateIconContext } from "./Icon";

const Probe = () => {
	const { controls } = useAnimateIconContext();

	return <span data-testid="probe" data-has-controls={String(controls !== undefined)} />;
};

const hoverTarget = (container: HTMLElement): HTMLElement => container.firstElementChild as HTMLElement;

const started = (): string[] => controls.start.mock.calls.map(([animation]) => animation);

const setTo = (): string[] => controls.set.mock.calls.map(([animation]) => animation);

const lastStarted = (): string | undefined => started().at(-1);

beforeEach(() => {
	inView.value = false;
	controls.start.mockReset();
	controls.start.mockResolvedValue(undefined);
	controls.set.mockReset();
});

describe("what AnimateIcon starts out doing", () => {
	it("sits still when nobody asked it to animate", async () => {
		render(
			<AnimateIcon>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(lastStarted()).toBe("initial"));
		expect(started()).not.toContain("animate");
	});

	it("sits still when told not to animate", async () => {
		render(
			<AnimateIcon animate={false}>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(lastStarted()).toBe("initial"));
		expect(started()).not.toContain("animate");
	});

	it("animates straight away when told to", async () => {
		render(
			<AnimateIcon animate>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(started()).toContain("animate"));
	});

	it("hands the controls to the icons inside it", () => {
		const { getByTestId } = render(
			<AnimateIcon>
				<Probe />
			</AnimateIcon>,
		);

		expect(getByTestId("probe").dataset.hasControls).toBe("true");
	});
});

describe("an animation driven by a prop", () => {
	it("starts when the prop turns on and stops when it turns off", async () => {
		const { rerender } = render(
			<AnimateIcon animate={false}>
				<Probe />
			</AnimateIcon>,
		);
		await waitFor(() => expect(lastStarted()).toBe("initial"));
		controls.start.mockClear();

		rerender(
			<AnimateIcon animate>
				<Probe />
			</AnimateIcon>,
		);
		await waitFor(() => expect(started()).toContain("animate"));
		controls.start.mockClear();

		rerender(
			<AnimateIcon animate={false}>
				<Probe />
			</AnimateIcon>,
		);
		await waitFor(() => expect(started()).toStrictEqual(["initial"]));
	});
});

describe("an animation driven by the pointer", () => {
	it("runs while a mouse is over it and stops when the mouse leaves", async () => {
		const { container } = render(
			<AnimateIcon animateOnHover>
				<Probe />
			</AnimateIcon>,
		);
		await waitFor(() => expect(lastStarted()).toBe("initial"));
		controls.start.mockClear();

		fireEvent.pointerEnter(hoverTarget(container), { pointerType: "mouse" });
		await waitFor(() => expect(started()).toContain("animate"));
		controls.start.mockClear();

		fireEvent.pointerLeave(hoverTarget(container), { pointerType: "mouse" });
		await waitFor(() => expect(started()).toStrictEqual(["initial"]));
	});

	it("ignores a touch, which has no hover to speak of", async () => {
		const { container } = render(
			<AnimateIcon animateOnHover>
				<Probe />
			</AnimateIcon>,
		);
		await waitFor(() => expect(lastStarted()).toBe("initial"));
		controls.start.mockClear();

		fireEvent.pointerEnter(hoverTarget(container), { pointerType: "touch" });

		expect(started()).toStrictEqual([]);
	});

	it("runs while it is pressed and stops on release", async () => {
		const { container } = render(
			<AnimateIcon animateOnTap>
				<Probe />
			</AnimateIcon>,
		);
		await waitFor(() => expect(lastStarted()).toBe("initial"));
		controls.start.mockClear();

		fireEvent.pointerDown(hoverTarget(container));
		await waitFor(() => expect(started()).toContain("animate"));
		controls.start.mockClear();

		fireEvent.pointerUp(hoverTarget(container));
		await waitFor(() => expect(started()).toStrictEqual(["initial"]));
	});

	it("stays still under a pointer it was not told to react to", async () => {
		const { container } = render(
			<AnimateIcon>
				<Probe />
			</AnimateIcon>,
		);
		await waitFor(() => expect(lastStarted()).toBe("initial"));
		controls.start.mockClear();

		fireEvent.pointerEnter(hoverTarget(container), { pointerType: "mouse" });
		fireEvent.pointerDown(hoverTarget(container));

		expect(started()).toStrictEqual([]);
	});

	it("keeps the child's own pointer handler beside the one it adds", () => {
		const onPointerEnter = vi.fn();

		const { container } = render(
			<AnimateIcon animateOnHover>
				<span data-testid="probe" onPointerEnter={onPointerEnter} />
			</AnimateIcon>,
		);

		fireEvent.pointerEnter(hoverTarget(container), { pointerType: "mouse" });

		expect(onPointerEnter).toHaveBeenCalledOnce();
	});
});

describe("what AnimateIcon passes through", () => {
	it("hands the props a trigger gives it on to the element it renders", () => {
		const { container } = render(
			<AnimateIcon aria-expanded="true">
				<Probe />
			</AnimateIcon>,
		);

		expect(hoverTarget(container).getAttribute("aria-expanded")).toBe("true");
	});

	it("hands them on to the child it slots into", () => {
		const { container } = render(
			<AnimateIcon asChild aria-expanded="true">
				<Probe />
			</AnimateIcon>,
		);

		expect(hoverTarget(container).getAttribute("aria-expanded")).toBe("true");
	});
});

describe("an animation driven by the viewport", () => {
	it("runs once the icon is in view", async () => {
		inView.value = true;

		render(
			<AnimateIcon animateOnView>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(started()).toContain("animate"));
	});

	it("stays still while the icon is out of view", async () => {
		render(
			<AnimateIcon animateOnView>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(lastStarted()).toBe("initial"));
		expect(started()).not.toContain("animate");
	});
});

describe("what AnimateIcon asks the motion controls to do", () => {
	it("runs the animation when it is turned on", async () => {
		render(
			<AnimateIcon animate>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(started()).toContain("animate"));
	});

	it("puts the icon back to its resting state when it is turned off", async () => {
		const { rerender } = render(
			<AnimateIcon animate>
				<Probe />
			</AnimateIcon>,
		);
		await waitFor(() => expect(started()).toContain("animate"));
		controls.start.mockClear();

		rerender(
			<AnimateIcon animate={false}>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(started()).toStrictEqual(["initial"]));
	});
});

describe("an animation that loops", () => {
	beforeEach(() => {
		controls.start.mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
	});

	it("resets to the start before each pass, so the second one is not a no-op", async () => {
		render(
			<AnimateIcon animate loop>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(started()).toContain("animate"));
		expect(setTo()).toContain("initial");
	});

	it("goes round again until it is called off", async () => {
		const { rerender } = render(
			<AnimateIcon animate loop>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(started().filter((animation) => animation === "animate").length).toBeGreaterThan(2));

		rerender(
			<AnimateIcon animate={false} loop>
				<Probe />
			</AnimateIcon>,
		);
		await waitFor(() => expect(lastStarted()).toBe("initial"));
		controls.start.mockClear();
		await new Promise<void>((resolve) => setTimeout(resolve, 20));

		expect(started()).toStrictEqual([]);
	});

	it("does not set the icon back to the start when it only plays once", async () => {
		render(
			<AnimateIcon animate>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(started()).toContain("animate"));
		expect(setTo()).toStrictEqual([]);
	});
});

const PlainIcon = ({ className }: { className?: string }) => <span data-testid="plain" className={className} />;

const plainIcon = PlainIcon as ComponentType<IconProps>;

describe("an icon with no AnimateIcon above it", () => {
	it("mints its own when it carries a trigger of its own", async () => {
		const { container } = render(<IconWrapper icon={Probe} animateOnHover />);
		await waitFor(() => expect(lastStarted()).toBe("initial"));
		controls.start.mockClear();

		fireEvent.pointerEnter(hoverTarget(container), { pointerType: "mouse" });

		await waitFor(() => expect(started()).toContain("animate"));
	});

	it("loops in the AnimateIcon it mints when it is told to", async () => {
		controls.start.mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
		inView.value = true;

		render(<IconWrapper icon={Probe} animateOnView loop />);

		await waitFor(() => expect(setTo()).toContain("initial"));
	});

	it("renders flat when nothing asks it to animate", () => {
		const { container } = render(<IconWrapper icon={Probe} />);

		expect(controls.start).not.toHaveBeenCalled();
		expect(container.querySelector('[data-testid="probe"]')).toBeTruthy();
	});

	it("passes its class and size on to the icon", () => {
		render(<IconWrapper icon={plainIcon} className="size-4" />);

		expect(screen.getByTestId("plain").className).toBe("size-4");
	});
});

describe("an icon inside an AnimateIcon", () => {
	it("shares the controls of the AnimateIcon above it when it carries no trigger of its own", () => {
		const { getByTestId } = render(
			<AnimateIcon animateOnHover>
				<IconWrapper icon={Probe} />
			</AnimateIcon>,
		);

		expect(getByTestId("probe").dataset.hasControls).toBe("true");
	});

	it("runs on its own trigger when it carries one", async () => {
		const { container } = render(
			<AnimateIcon>
				<IconWrapper icon={Probe} animateOnHover />
			</AnimateIcon>,
		);
		await waitFor(() => expect(lastStarted()).toBe("initial"));
		controls.start.mockClear();

		fireEvent.pointerEnter(container.querySelector('[data-slot="motion-slot"]') as HTMLElement, {
			pointerType: "mouse",
		});

		await waitFor(() => expect(started()).toContain("animate"));
	});
});
