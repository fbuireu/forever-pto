"use client";

import { useIsInView } from "@ui/hooks/useIsInView";
import { type HTMLMotionProps, m, type SVGMotionProps, useAnimation } from "motion/react";
import {
	type ComponentType,
	createContext,
	isValidElement,
	type PointerEvent,
	type ReactElement,
	type ReactNode,
	type SyntheticEvent,
	use,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { MotionSlot, type WithAsChild } from "../primitives/animate/MotionSlot";

interface AnimateIconContextValue {
	controls: ReturnType<typeof useAnimation>;
	loop: boolean;
	animate: boolean;
}

interface AnimateIconBaseProps extends Omit<HTMLMotionProps<"span">, "animate"> {
	children: ReactNode;
	animate?: boolean;
	animateOnHover?: boolean;
	animateOnTap?: boolean;
	animateOnView?: boolean;
	loop?: boolean;
}

type AnimateIconProps = WithAsChild<AnimateIconBaseProps>;

interface IconProps extends Omit<SVGMotionProps<SVGSVGElement>, "animate"> {
	animateOnHover?: boolean;
	animateOnView?: boolean;
	loop?: boolean;
	size?: number;
}

interface IconWrapperProps extends IconProps {
	icon: ComponentType<IconProps>;
}

const AnimateIconContext = createContext<AnimateIconContextValue | null>(null);

function useAnimateIconContext(): { controls: AnimateIconContextValue["controls"] | undefined } {
	const context = use(AnimateIconContext);
	return { controls: context?.controls };
}

interface ComposeEventHandlersParams<E extends SyntheticEvent<unknown>> {
	theirs?: (event: E) => void;
	ours?: (event: E) => void;
}

function composeEventHandlers<E extends SyntheticEvent<unknown>>({
	theirs,
	ours,
}: ComposeEventHandlersParams<E> = {}): (event: E) => void {
	return (event: E) => {
		theirs?.(event);
		ours?.(event);
	};
}

interface StartAnimParams {
	anim: "initial" | "animate";
	method?: "start" | "set";
}

type PointerHandler = (event: PointerEvent<unknown>) => void;

interface ChildPointerHandlers {
	onPointerEnter?: PointerHandler;
	onPointerLeave?: PointerHandler;
	onPointerDown?: PointerHandler;
	onPointerUp?: PointerHandler;
}

function AnimateIcon({
	asChild = false,
	animate = false,
	animateOnHover = false,
	animateOnTap = false,
	animateOnView = false,
	loop = false,
	children,
	...props
}: AnimateIconProps) {
	const controls = useAnimation();

	const [localAnimate, setLocalAnimate] = useState<boolean>(animate);
	const statusRef = useRef<"initial" | "animate">("initial");

	const runGenRef = useRef(0);
	const cancelledRef = useRef(false);
	const mountedRef = useRef(false);
	const activeRef = useRef<boolean>(localAnimate);

	useLayoutEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const startAnimation = useCallback(() => {
		runGenRef.current++;
		setLocalAnimate(true);
	}, []);

	const stopAnimation = useCallback(() => {
		runGenRef.current++;
		setLocalAnimate(false);
	}, []);

	useEffect(() => {
		activeRef.current = localAnimate;
	}, [localAnimate]);

	useEffect(() => {
		if (animate) startAnimation();
		else stopAnimation();
	}, [animate, stopAnimation, startAnimation]);

	const viewOuterRef = useRef<HTMLElement>(null);
	const { ref: inViewRef, isInView } = useIsInView({
		ref: viewOuterRef,
		options: {
			inView: animateOnView,
			inViewOnce: true,
		},
	});

	const startAnim = useCallback(
		async ({ anim, method = "start" }: StartAnimParams) => {
			if (!mountedRef.current) return;
			await Promise.resolve(controls[method](anim)).catch(() => {});
			statusRef.current = anim;
		},
		[controls],
	);

	useEffect(() => {
		if (!animateOnView) return;
		if (isInView) startAnimation();
		else stopAnimation();
	}, [isInView, animateOnView, startAnimation, stopAnimation]);

	useEffect(() => {
		const gen = ++runGenRef.current;
		cancelledRef.current = false;

		const isStale = () => cancelledRef.current || gen !== runGenRef.current;

		async function run() {
			if (!localAnimate) {
				await startAnim({ anim: "initial" });
				return;
			}

			if (loop) await startAnim({ anim: "initial", method: "set" });

			if (isStale()) {
				await startAnim({ anim: "initial" });
				return;
			}

			await startAnim({ anim: "animate" });

			if (isStale()) {
				await startAnim({ anim: "initial" });
				return;
			}

			if (!loop) return;

			if (!activeRef.current) {
				if (statusRef.current !== "initial") await startAnim({ anim: "initial" });
				return;
			}

			await run();
		}

		void run();

		return () => {
			cancelledRef.current = true;
		};
	}, [localAnimate, loop, startAnim]);

	const childProps: ChildPointerHandlers = isValidElement<ChildPointerHandlers>(children) ? children.props : {};

	const handlePointerEnter = composeEventHandlers<PointerEvent<unknown>>({
		theirs: childProps.onPointerEnter,
		ours: (event) => {
			if (event.pointerType !== "mouse") return;
			if (animateOnHover) startAnimation();
		},
	});

	const handlePointerLeave = composeEventHandlers<PointerEvent<unknown>>({
		theirs: childProps.onPointerLeave,
		ours: (event) => {
			if (event.pointerType !== "mouse") return;
			if (animateOnHover || animateOnTap) stopAnimation();
		},
	});

	const handlePointerDown = composeEventHandlers({
		theirs: childProps.onPointerDown,
		ours: () => {
			if (animateOnTap) startAnimation();
		},
	});

	const handlePointerUp = composeEventHandlers({
		theirs: childProps.onPointerUp,
		ours: () => {
			if (animateOnTap) stopAnimation();
		},
	});

	const contextValue = useMemo(() => ({ controls, loop, animate }), [controls, loop, animate]);

	const content = asChild ? (
		<MotionSlot
			ref={inViewRef}
			onPointerEnter={handlePointerEnter}
			onPointerLeave={handlePointerLeave}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			{...props}
		>
			{children as ReactElement}
		</MotionSlot>
	) : (
		<m.span
			ref={inViewRef}
			onPointerEnter={handlePointerEnter}
			onPointerLeave={handlePointerLeave}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			{...props}
		>
			{children}
		</m.span>
	);

	return <AnimateIconContext value={contextValue}>{content}</AnimateIconContext>;
}

function IconWrapper({
	size = 28,
	animateOnHover,
	animateOnView,
	loop,
	icon: IconComponent,
	...props
}: IconWrapperProps) {
	const context = use(AnimateIconContext);

	if (context) {
		if (animateOnHover !== undefined || animateOnView !== undefined || loop !== undefined) {
			return (
				<AnimateIcon
					animate={context.animate}
					animateOnHover={animateOnHover}
					animateOnView={animateOnView}
					loop={loop ?? context.loop}
					asChild
				>
					<IconComponent size={size} {...props} />
				</AnimateIcon>
			);
		}

		return <IconComponent size={size} {...props} />;
	}

	if (animateOnHover !== undefined || animateOnView !== undefined) {
		return (
			<AnimateIcon animateOnHover={animateOnHover} animateOnView={animateOnView} loop={loop} asChild>
				<IconComponent size={size} {...props} />
			</AnimateIcon>
		);
	}

	return <IconComponent size={size} {...props} />;
}

export { AnimateIcon, type IconProps, IconWrapper, useAnimateIconContext };
