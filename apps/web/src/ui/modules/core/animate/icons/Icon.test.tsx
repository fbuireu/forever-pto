import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ComponentType, ReactNode } from "react";
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

import { AnimateIcon, type IconProps, IconWrapper, useAnimateIconContext, useVariants } from "./Icon";

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
	controls.start.mockReset();
	controls.start.mockResolvedValue(undefined);
	controls.set.mockReset();
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

const started = () => controls.start.mock.calls.map(([animation]) => animation);

const setTo = () => controls.set.mock.calls.map(([animation]) => animation);

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

	it("leaves it where the animation ended when it is told to persist", async () => {
		const { rerender } = render(
			<AnimateIcon animate persistOnAnimateEnd>
				<Probe />
			</AnimateIcon>,
		);
		await waitFor(() => expect(started()).toContain("animate"));
		controls.start.mockClear();

		rerender(
			<AnimateIcon animate={false} persistOnAnimateEnd>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(isActive(document.body)).toBe(false));
		expect(started()).not.toContain("initial");
	});

	it("snaps back to the resting state after the animation, rather than animating back", async () => {
		render(
			<AnimateIcon animate initialOnAnimateEnd>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(setTo()).toContain("initial"));
		expect(started()).not.toContain("initial");
	});
});

describe("an animation that loops", () => {
	it("resets to the start before each pass, so the second one is not a no-op", async () => {
		render(
			<AnimateIcon animate loop loopDelay={300}>
				<Probe />
			</AnimateIcon>,
		);

		await waitFor(() => expect(started()).toContain("animate"));
		expect(setTo()).toContain("initial");
	});

	it("waits the loop delay out before going round again", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

		render(
			<AnimateIcon animate loop loopDelay={300}>
				<Probe />
			</AnimateIcon>,
		);
		await act(async () => {});
		expect(started().filter((animation) => animation === "animate")).toHaveLength(1);

		await act(async () => {
			vi.advanceTimersByTime(300);
		});

		expect(started().filter((animation) => animation === "animate")).toHaveLength(2);
	});

	it("stops going round when the animation is called off mid-delay", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

		const { rerender } = render(
			<AnimateIcon animate loop loopDelay={300}>
				<Probe />
			</AnimateIcon>,
		);
		await act(async () => {});

		rerender(
			<AnimateIcon animate={false} loop loopDelay={300}>
				<Probe />
			</AnimateIcon>,
		);
		controls.start.mockClear();

		await act(async () => {
			vi.advanceTimersByTime(300);
		});

		expect(started()).not.toContain("animate");
	});

	it("stops going round when the icon goes away mid-delay", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

		const { unmount } = render(
			<AnimateIcon animate loop loopDelay={300}>
				<Probe />
			</AnimateIcon>,
		);
		await act(async () => {});
		unmount();
		controls.start.mockClear();

		await act(async () => {
			vi.advanceTimersByTime(300);
		});

		expect(started()).not.toContain("animate");
	});
});

const VARIANTS = {
	default: { group: { initial: { x: 0 }, animate: { x: 1 } }, path: { initial: { y: 0 }, animate: { y: 1 } } },
	nod: { group: { initial: { x: 2 }, animate: { x: 3 } }, path: { initial: { y: 2 }, animate: { y: 3 } } },
};

const VariantProbe = () => <span data-testid="variants">{JSON.stringify(useVariants(VARIANTS))}</span>;

const readVariants = () => JSON.parse(screen.getByTestId("variants").textContent ?? "{}") as Record<string, unknown>;

describe("useVariants", () => {
	it("hands back the default set when nothing names another", () => {
		render(
			<AnimateIcon>
				<VariantProbe />
			</AnimateIcon>,
		);

		expect(readVariants()).toStrictEqual(VARIANTS.default);
	});

	it("hands back the named set when the trigger names one", () => {
		render(
			<AnimateIcon animate="nod">
				<VariantProbe />
			</AnimateIcon>,
		);

		expect(readVariants()).toStrictEqual(VARIANTS.nod);
	});

	it("falls back to the default rather than nothing for a name it does not know", () => {
		render(
			<AnimateIcon animate="does-not-exist">
				<VariantProbe />
			</AnimateIcon>,
		);

		expect(readVariants()).toStrictEqual(VARIANTS.default);
	});

	it("gives every part the same stroke animation for the built-in path animation", () => {
		render(
			<AnimateIcon animate="path">
				<VariantProbe />
			</AnimateIcon>,
		);

		expect(Object.keys(readVariants())).toStrictEqual(["path"]);
		expect(readVariants().path).toMatchObject({ initial: { pathLength: 1 } });
	});
});

const PLAIN_ICON_CLASS = "[&_[stroke-dasharray='1px_1px']]:![stroke-dasharray:1px_0px]";

const PlainIcon = ({ className }: { className?: string }) => <span data-testid="plain" className={className} />;

const plainIcon = PlainIcon as ComponentType<IconProps<string>>;

describe("an icon with no AnimateIcon above it", () => {
	it("mints its own when it carries a trigger of its own", () => {
		const { container } = render(<IconWrapper icon={Probe} animateOnHover />);

		fireEvent.pointerEnter(container.firstElementChild as HTMLElement, { pointerType: "mouse" });

		expect(isActive(container)).toBe(true);
	});

	it("renders flat when nothing asks it to animate", () => {
		const { container } = render(<IconWrapper icon={Probe} />);

		expect(isActive(container)).toBe(false);
		expect(probeOf(container)).toBeTruthy();
	});

	it("marks the icon for the stroke animation, which is a class rather than a variant", () => {
		render(<IconWrapper icon={plainIcon} animation="path" />);

		expect(screen.getByTestId("plain").className).toContain(PLAIN_ICON_CLASS);
	});

	it("leaves that class off an icon animating any other way", () => {
		render(<IconWrapper icon={plainIcon} animation="nod" />);

		expect(screen.getByTestId("plain").className).not.toContain(PLAIN_ICON_CLASS);
	});
});
