import { act, fireEvent, render } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MotionSpanProps = ComponentProps<"span"> & {
	animate?: unknown;
	transition?: unknown;
	initial?: unknown;
	exit?: unknown;
};

type MotionSlotMockProps = ComponentProps<"div"> & {
	animate?: unknown;
	transition?: unknown;
	children: ReactNode;
};

const inView = vi.hoisted(() => ({ value: false }));

vi.mock("motion/react", async () => {
	const { createElement } = await import("react");
	return {
		m: {
			span: ({ children, animate: _a, transition: _t, initial: _i, exit: _e, ...props }: MotionSpanProps) =>
				createElement("span", props, children),
		},
		useAnimation: () => ({
			start: () => Promise.resolve(),
			set: () => undefined,
		}),
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

import { AnimateIcon, IconWrapper, useAnimateIconContext } from "./Icon";

const PersistProbe = () => {
	const { persistOnAnimateEnd } = useAnimateIconContext();
	return <span data-testid="persist">{String(persistOnAnimateEnd)}</span>;
};

const Probe = () => {
	const { active, animation, loop, loopDelay } = useAnimateIconContext();

	return (
		<span data-testid="probe" data-active={String(active)} data-animation={animation} data-loop={String(loop)}>
			{loopDelay}
		</span>
	);
};

const probeOf = (container: HTMLElement) => container.querySelector('[data-testid="probe"]') as HTMLElement;

const isActive = (container: HTMLElement) => probeOf(container).dataset.active === "true";

beforeEach(() => {
	inView.value = false;
});

afterEach(() => {
	vi.useRealTimers();
});

describe("AnimateIcon", () => {
	it("exposes persistOnAnimateEnd to its own children", () => {
		const { getByTestId } = render(
			<AnimateIcon persistOnAnimateEnd>
				<PersistProbe />
			</AnimateIcon>,
		);

		expect(getByTestId("persist").textContent).toBe("true");
	});

	it("propagates persistOnAnimateEnd to a nested icon that inherits the parent animation", () => {
		const { getByTestId } = render(
			<AnimateIcon persistOnAnimateEnd>
				<IconWrapper icon={PersistProbe} />
			</AnimateIcon>,
		);

		expect(getByTestId("persist").textContent).toBe("true");
	});

	it("propagates persistOnAnimateEnd to a nested icon that overrides another prop", () => {
		const { getByTestId } = render(
			<AnimateIcon persistOnAnimateEnd>
				<IconWrapper icon={PersistProbe} loop />
			</AnimateIcon>,
		);

		expect(getByTestId("persist").textContent).toBe("true");
	});
});

describe("what AnimateIcon starts out doing", () => {
	it("sits still when nobody asked it to animate", () => {
		const { container } = render(
			<AnimateIcon>
				<Probe />
			</AnimateIcon>,
		);

		expect(isActive(container)).toBe(false);
	});

	it("sits still when told not to animate", () => {
		const { container } = render(
			<AnimateIcon animate={false}>
				<Probe />
			</AnimateIcon>,
		);

		expect(isActive(container)).toBe(false);
	});

	it("animates straight away when told to, with no delay to wait out", () => {
		const { container } = render(
			<AnimateIcon animate>
				<Probe />
			</AnimateIcon>,
		);

		expect(isActive(container)).toBe(true);
	});

	it("takes the named animation from the trigger rather than the default", () => {
		const { container } = render(
			<AnimateIcon animate="path-loop">
				<Probe />
			</AnimateIcon>,
		);

		expect(probeOf(container).dataset.animation).toBe("path-loop");
		expect(isActive(container)).toBe(true);
	});

	it("passes the loop settings down as it was given them", () => {
		const { container } = render(
			<AnimateIcon loop loopDelay={250}>
				<Probe />
			</AnimateIcon>,
		);

		expect(probeOf(container).dataset.loop).toBe("true");
		expect(probeOf(container).textContent).toBe("250");
	});
});

describe("a delayed animation", () => {
	it("waits the delay out before it starts", () => {
		vi.useFakeTimers();

		const { container } = render(
			<AnimateIcon animate delay={300}>
				<Probe />
			</AnimateIcon>,
		);

		expect(isActive(container)).toBe(false);

		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(isActive(container)).toBe(true);
	});

	it("is called off by a stop that lands inside the delay", () => {
		vi.useFakeTimers();

		const { container, rerender } = render(
			<AnimateIcon animate delay={300}>
				<Probe />
			</AnimateIcon>,
		);

		rerender(
			<AnimateIcon animate={false} delay={300}>
				<Probe />
			</AnimateIcon>,
		);

		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(isActive(container)).toBe(false);
	});
});

describe("an animation driven by a prop", () => {
	it("starts when the prop turns on and stops when it turns off", () => {
		const { container, rerender } = render(
			<AnimateIcon animate={false}>
				<Probe />
			</AnimateIcon>,
		);
		expect(isActive(container)).toBe(false);

		rerender(
			<AnimateIcon animate>
				<Probe />
			</AnimateIcon>,
		);
		expect(isActive(container)).toBe(true);

		rerender(
			<AnimateIcon animate={false}>
				<Probe />
			</AnimateIcon>,
		);
		expect(isActive(container)).toBe(false);
	});
});

describe("an animation driven by the pointer", () => {
	const hoverTarget = (container: HTMLElement) => container.firstElementChild as HTMLElement;

	it("runs while a mouse is over it and stops when the mouse leaves", () => {
		const { container } = render(
			<AnimateIcon animateOnHover>
				<Probe />
			</AnimateIcon>,
		);

		fireEvent.pointerEnter(hoverTarget(container), { pointerType: "mouse" });
		expect(isActive(container)).toBe(true);

		fireEvent.pointerLeave(hoverTarget(container), { pointerType: "mouse" });
		expect(isActive(container)).toBe(false);
	});

	it("ignores a touch, which has no hover to speak of", () => {
		const { container } = render(
			<AnimateIcon animateOnHover>
				<Probe />
			</AnimateIcon>,
		);

		fireEvent.pointerEnter(hoverTarget(container), { pointerType: "touch" });

		expect(isActive(container)).toBe(false);
	});

	it("runs while it is pressed and stops on release", () => {
		const { container } = render(
			<AnimateIcon animateOnTap>
				<Probe />
			</AnimateIcon>,
		);

		fireEvent.pointerDown(hoverTarget(container));
		expect(isActive(container)).toBe(true);

		fireEvent.pointerUp(hoverTarget(container));
		expect(isActive(container)).toBe(false);
	});

	it("stays still under a pointer it was not told to react to", () => {
		const { container } = render(
			<AnimateIcon>
				<Probe />
			</AnimateIcon>,
		);

		fireEvent.pointerEnter(hoverTarget(container), { pointerType: "mouse" });
		fireEvent.pointerDown(hoverTarget(container));

		expect(isActive(container)).toBe(false);
	});

	it("takes the animation the trigger names", () => {
		const { container } = render(
			<AnimateIcon animateOnHover="path-loop">
				<Probe />
			</AnimateIcon>,
		);

		fireEvent.pointerEnter(hoverTarget(container), { pointerType: "mouse" });

		expect(probeOf(container).dataset.animation).toBe("path-loop");
	});
});

describe("an animation driven by the viewport", () => {
	it("runs once the icon is in view", () => {
		inView.value = true;

		const { container } = render(
			<AnimateIcon animateOnView>
				<Probe />
			</AnimateIcon>,
		);

		expect(isActive(container)).toBe(true);
	});

	it("stays still while the icon is out of view", () => {
		const { container } = render(
			<AnimateIcon animateOnView>
				<Probe />
			</AnimateIcon>,
		);

		expect(isActive(container)).toBe(false);
	});
});

describe("what AnimateIcon passes through", () => {
	it("stamps its own data attributes onto the child it wraps", () => {
		const { container } = render(
			<AnimateIcon data-tutorial="calendar-list">
				<span data-testid="probe" />
			</AnimateIcon>,
		);

		expect(probeOf(container).dataset.tutorial).toBe("calendar-list");
	});

	it("leaves a child alone when it carries no data attributes to pass on", () => {
		const { container } = render(
			<AnimateIcon>
				<span data-testid="probe" />
			</AnimateIcon>,
		);

		expect(probeOf(container).dataset.tutorial).toBeUndefined();
	});

	it("keeps the child's own pointer handler beside the one it adds", () => {
		const onPointerEnter = vi.fn();

		const { container } = render(
			<AnimateIcon animateOnHover>
				<span data-testid="probe" onPointerEnter={onPointerEnter} />
			</AnimateIcon>,
		);

		fireEvent.pointerEnter(container.firstElementChild as HTMLElement, { pointerType: "mouse" });

		expect(onPointerEnter).toHaveBeenCalledOnce();
	});
});
