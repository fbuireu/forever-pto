"use client";

import { cn } from "@ui/utils/cn";
import type { Transition } from "motion/react";
import { AnimatePresence, m } from "motion/react";
import {
	type ComponentProps,
	cloneElement,
	createContext,
	isValidElement,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
	use,
	useCallback,
	useEffect,
	useId,
	useImperativeHandle,
	useRef,
	useState,
} from "react";

type MotionHighlightMode = "children" | "parent";

interface Bounds {
	top: number;
	left: number;
	width: number;
	height: number;
}

interface MotionHighlightContextType<T extends string> {
	mode: MotionHighlightMode;
	activeValue: T | null;
	setActiveValue: (value: T | null) => void;
	setBounds: (bounds: DOMRect) => void;
	clearBounds: () => void;
	id: string;
	hover: boolean;
	className?: string;
	activeClassName?: string;
	setActiveClassName: (className: string) => void;
	transition: Transition;
}

const EXIT_DELAY = 0.2;

// biome-ignore lint/suspicious/noExplicitAny: generic context; T is contravariant in setActiveValue, string does not satisfy all subtypes of T
const MotionHighlightContext = createContext<MotionHighlightContextType<any> | undefined>(undefined);

function useMotionHighlight<T extends string>(): MotionHighlightContextType<T> {
	const context = use(MotionHighlightContext);
	if (!context) {
		throw new Error("useMotionHighlight must be used within a MotionHighlightProvider");
	}
	return context;
}

interface MotionHighlightProps<T extends string> {
	mode?: MotionHighlightMode;
	value?: T | null;
	className?: string;
	containerClassName?: string;
	transition: Transition;
	hover?: boolean;
	children: ReactNode;
}

function MotionHighlight<T extends string>({
	mode = "children",
	value,
	className,
	containerClassName,
	transition,
	hover = false,
	children,
}: MotionHighlightProps<T>) {
	const localRef = useRef<HTMLDivElement>(null);

	const [activeValue, setActiveValue] = useState<T | null>(value ?? null);
	const [boundsState, setBoundsState] = useState<Bounds | null>(null);
	const [activeClassNameState, setActiveClassNameState] = useState<string>("");

	const safeSetActiveValue = useCallback((id: T | null) => {
		setActiveValue((prev) => (prev === id ? prev : id));
	}, []);

	const safeSetBounds = (bounds: DOMRect) => {
		if (!localRef.current) return;

		const containerRect = localRef.current.getBoundingClientRect();
		const newBounds: Bounds = {
			top: bounds.top - containerRect.top,
			left: bounds.left - containerRect.left,
			width: bounds.width,
			height: bounds.height,
		};

		setBoundsState((prev) => {
			if (
				prev?.top === newBounds.top &&
				prev.left === newBounds.left &&
				prev.width === newBounds.width &&
				prev.height === newBounds.height
			) {
				return prev;
			}
			return newBounds;
		});
	};

	const clearBounds = useCallback(() => {
		setBoundsState((prev) => (prev === null ? prev : null));
	}, []);

	useEffect(() => {
		if (value !== undefined) setActiveValue(value);
	}, [value]);

	const id = useId();

	const safeSetBoundsRef = useRef(safeSetBounds);
	safeSetBoundsRef.current = safeSetBounds;

	useEffect(() => {
		if (mode !== "parent") return;
		const container = localRef.current;
		if (!container) return;

		const onScroll = () => {
			if (!activeValue) return;
			const activeEl = container.querySelector<HTMLElement>(`[data-value="${activeValue}"][data-highlight="true"]`);
			if (activeEl) safeSetBoundsRef.current(activeEl.getBoundingClientRect());
		};

		container.addEventListener("scroll", onScroll, { passive: true });
		return () => container.removeEventListener("scroll", onScroll);
	}, [mode, activeValue]);

	const contextValue = {
		mode,
		activeValue,
		setActiveValue: safeSetActiveValue,
		id,
		hover,
		className,
		transition,
		setBounds: safeSetBounds,
		clearBounds,
		activeClassName: activeClassNameState,
		setActiveClassName: setActiveClassNameState,
	};

	return (
		<MotionHighlightContext value={contextValue}>
			{mode === "parent" ? (
				<div ref={localRef} data-slot="motion-highlight-container" className={cn("relative", containerClassName)}>
					<AnimatePresence initial={false}>
						{boundsState && (
							<m.div
								data-slot="motion-highlight"
								animate={{
									top: boundsState.top,
									left: boundsState.left,
									width: boundsState.width,
									height: boundsState.height,
									opacity: 1,
								}}
								initial={{
									top: boundsState.top,
									left: boundsState.left,
									width: boundsState.width,
									height: boundsState.height,
									opacity: 0,
								}}
								exit={{
									opacity: 0,
									transition: {
										...transition,
										delay: (transition.delay ?? 0) + EXIT_DELAY,
									},
								}}
								transition={transition}
								className={cn("absolute bg-muted z-0 rounded-md", className, activeClassNameState)}
							/>
						)}
					</AnimatePresence>
					{children}
				</div>
			) : (
				children
			)}
		</MotionHighlightContext>
	);
}

interface GetNonOverridingDataAttributesParams {
	element: ReactElement;
	dataAttributes: Record<string, unknown>;
}

function getNonOverridingDataAttributes({
	element,
	dataAttributes,
}: GetNonOverridingDataAttributesParams): Record<string, unknown> {
	return Object.keys(dataAttributes).reduce<Record<string, unknown>>((acc, key) => {
		if ((element.props as Record<string, unknown>)[key] === undefined) {
			acc[key] = dataAttributes[key];
		}
		return acc;
	}, {});
}

interface ExtendedChildProps extends Omit<ComponentProps<"div">, "ref"> {
	id?: string;
	"data-value"?: string;
}

interface MotionHighlightItemProps extends ComponentProps<"div"> {
	children: ReactElement;
	value?: string;
	className?: string;
	activeClassName?: string;
}

function MotionHighlightItem({ ref, children, value, className, activeClassName, ...props }: MotionHighlightItemProps) {
	const itemId = useId();
	const {
		activeValue,
		setActiveValue,
		mode,
		setBounds,
		clearBounds,
		hover,
		className: contextClassName,
		transition,
		id: contextId,
		setActiveClassName,
	} = useMotionHighlight();

	const element = children as ReactElement<ExtendedChildProps>;
	const childValue = value ?? element.props?.["data-value"] ?? element.props?.id ?? itemId;
	const isActive = activeValue === childValue;

	const localRef = useRef<HTMLDivElement>(null);
	useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

	useEffect(() => {
		if (mode !== "parent") return;

		if (isActive) {
			if (localRef.current) setBounds(localRef.current.getBoundingClientRect());
			setActiveClassName(activeClassName ?? "");
		} else if (!activeValue) clearBounds();
	}, [mode, isActive, activeValue, setBounds, clearBounds, activeClassName, setActiveClassName]);

	if (!isValidElement(children)) return children;

	const dataAttributes = {
		"data-active": isActive ? "true" : "false",
		"data-selected": isActive ? "true" : "false",
		"data-disabled": false,
		"data-value": childValue,
		"data-highlight": true,
	};

	const commonHandlers = hover
		? {
				onMouseEnter: (e: MouseEvent<HTMLDivElement>) => {
					setActiveValue(childValue);
					element.props.onMouseEnter?.(e);
				},
				onMouseLeave: (e: MouseEvent<HTMLDivElement>) => {
					setActiveValue(null);
					element.props.onMouseLeave?.(e);
				},
			}
		: {
				onClick: (e: MouseEvent<HTMLDivElement>) => {
					setActiveValue(childValue);
					element.props.onClick?.(e);
				},
			};

	return (
		<div
			key={childValue}
			ref={localRef}
			data-slot="motion-highlight-item-container"
			className={cn(mode === "children" && "relative", className)}
			{...dataAttributes}
			{...props}
			{...commonHandlers}
		>
			{mode === "children" && (
				<AnimatePresence initial={false}>
					{isActive && (
						<m.div
							layoutId={`transition-background-${contextId}`}
							data-slot="motion-highlight"
							className={cn("absolute inset-0 bg-muted z-0 rounded-md", contextClassName, activeClassName)}
							transition={transition}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{
								opacity: 0,
								transition: {
									...transition,
									delay: (transition.delay ?? 0) + EXIT_DELAY,
								},
							}}
							{...dataAttributes}
						/>
					)}
				</AnimatePresence>
			)}

			{cloneElement(element, {
				className: cn("relative z-[1]", element.props.className),
				...getNonOverridingDataAttributes({
					element,
					dataAttributes: { ...dataAttributes, "data-slot": "motion-highlight-item" },
				}),
			})}
		</div>
	);
}

export { MotionHighlight, MotionHighlightItem };
