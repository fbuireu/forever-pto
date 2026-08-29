"use client";

import { AutoHeight } from "@ui/modules/core/animate/effects/AutoHeight";
import { cn } from "@ui/utils/cn";
import { AnimatePresence, type HTMLMotionProps, m, type Transition } from "motion/react";
import {
	Children,
	type ComponentProps,
	cloneElement,
	createContext,
	isValidElement,
	type KeyboardEvent,
	type ReactElement,
	type ReactNode,
	use,
	useCallback,
	useId,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { MotionHighlight, MotionHighlightItem } from "../effects/MotionHighlight";

type TabsContextType = {
	activeValue: string;
	handleValueChange: (value: string) => void;
	triggerId: (value: string) => string;
	panelId: (value: string) => string;
};

interface NextTabIndexParams {
	key: string;
	current: number;
	total: number;
}

const nextTabIndex = ({ key, current, total }: NextTabIndexParams): number | null => {
	switch (key) {
		case "ArrowRight":
			return (current + 1) % total;
		case "ArrowLeft":
			return (current - 1 + total) % total;
		case "Home":
			return 0;
		case "End":
			return total - 1;
		default:
			return null;
	}
};

interface ActivateSiblingTabParams {
	from: HTMLElement;
	key: string;
}

const activateSiblingTab = ({ from, key }: ActivateSiblingTabParams) => {
	const list = from.closest('[role="tablist"]');
	if (!list) return false;

	const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'));
	const current = tabs.indexOf(from);
	if (current === -1) return false;

	const target = nextTabIndex({ key, current, total: tabs.length });
	if (target === null) return false;

	tabs[target].focus();
	tabs[target].click();
	return true;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs() {
	const ctx = use(TabsContext);
	if (!ctx) throw new Error("useTabs must be used within a Tabs");
	return ctx;
}

type TabsProps = ComponentProps<"div"> & {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
};

function Tabs({ defaultValue, value, onValueChange, children, className, ...props }: TabsProps) {
	const [internalValue, setInternalValue] = useState(defaultValue ?? "");
	const isControlled = value !== undefined;
	const activeValue = isControlled ? value : internalValue;

	const handleValueChange = useCallback(
		(val: string) => {
			if (!isControlled) setInternalValue(val);
			onValueChange?.(val);
		},
		[isControlled, onValueChange],
	);

	const baseId = useId();

	const contextValue = useMemo(
		() => ({
			activeValue,
			handleValueChange,
			triggerId: (val: string) => `${baseId}tab-${val}`,
			panelId: (val: string) => `${baseId}panel-${val}`,
		}),
		[activeValue, handleValueChange, baseId],
	);

	return (
		<TabsContext.Provider value={contextValue}>
			<div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props}>
				{children}
			</div>
		</TabsContext.Provider>
	);
}

type TabsHighlightProps = {
	children: ReactNode;
	activeClassName?: string;
	transition?: Transition;
};

function TabsHighlight({
	children,
	activeClassName,
	transition = { type: "spring", stiffness: 200, damping: 25 },
}: Readonly<TabsHighlightProps>) {
	const { activeValue } = useTabs();

	return (
		<MotionHighlight
			controlledItems
			mode="parent"
			className={cn("rounded-md bg-accent border-2 border-(--frame) shadow-(--shadow-brutal-xs)", activeClassName)}
			value={activeValue}
			transition={transition}
		>
			{children}
		</MotionHighlight>
	);
}

type TabsListProps = ComponentProps<"div">;

function TabsList({ children, className, ...props }: TabsListProps) {
	return (
		<div
			role="tablist"
			data-slot="tabs-list"
			className={cn(
				"bg-(--surface-panel-soft) gap-1 text-muted-foreground inline-flex h-10 w-fit items-center justify-center rounded-xl border-[3px] border-(--frame) p-0.75 shadow-(--shadow-brutal-xs)",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

type TabsHighlightItemProps = {
	value: string;
	children: ReactElement;
	className?: string;
};

function TabsHighlightItem({ value, children, className }: Readonly<TabsHighlightItemProps>) {
	return (
		<MotionHighlightItem value={value} className={cn("size-full", className)}>
			{children}
		</MotionHighlightItem>
	);
}

type TabsTriggerProps = HTMLMotionProps<"button"> & { value: string };

function TabsTrigger({ ref, value, children, className, onKeyDown, ...props }: TabsTriggerProps) {
	const { activeValue, handleValueChange, triggerId, panelId } = useTabs();
	const localRef = useRef<HTMLButtonElement>(null);
	useImperativeHandle(ref, () => localRef.current as HTMLButtonElement);
	const isActive = activeValue === value;

	const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (activateSiblingTab({ from: event.currentTarget, key: event.key })) event.preventDefault();
		onKeyDown?.(event);
	};

	return (
		<m.button
			ref={localRef}
			data-slot="tabs-trigger"
			role="tab"
			id={triggerId(value)}
			aria-selected={isActive}
			aria-controls={isActive ? panelId(value) : undefined}
			tabIndex={isActive ? 0 : -1}
			whileTap={{ scale: 0.95 }}
			onClick={() => handleValueChange(value)}
			onKeyDown={handleKeyDown}
			data-state={isActive ? "active" : "inactive"}
			className={cn(
				"inline-flex cursor-pointer items-center size-full justify-center whitespace-nowrap rounded-sm px-2 py-1 text-sm font-medium transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-accent-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground z-1",
				className,
			)}
			{...props}
		>
			{children}
		</m.button>
	);
}

type TabsContentsProps = Omit<HTMLMotionProps<"div">, "children" | "transition"> & {
	children?: ReactNode;
	mode?: "auto-height" | "layout";
	transition?: Transition;
};

function TabsContents({
	children,
	className,
	mode = "auto-height",
	transition = { type: "spring", stiffness: 200, damping: 25 },
	...props
}: TabsContentsProps) {
	const { activeValue } = useTabs();
	const activeChild = Children.toArray(children).find(
		(child): child is ReactElement<TabsContentProps> =>
			isValidElement<TabsContentProps>(child) && child.props.value === activeValue,
	);

	const content = (
		<AnimatePresence initial={false} mode="wait">
			{activeChild ? cloneElement(activeChild, { key: activeValue }) : null}
		</AnimatePresence>
	);

	if (mode === "layout") {
		return (
			<m.div data-slot="tabs-contents" layout className={cn(className)} transition={transition} {...props}>
				{content}
			</m.div>
		);
	}

	return (
		<AutoHeight
			data-slot="tabs-contents"
			className={cn(className)}
			deps={[activeValue]}
			transition={transition}
			{...props}
		>
			{content}
		</AutoHeight>
	);
}

type TabsContentProps = Omit<HTMLMotionProps<"div">, "value"> & {
	value: string;
	transition?: Transition;
};

function TabsContent({
	value: _value,
	children,
	className,
	transition = { duration: 0.22, ease: "easeOut" },
	...props
}: TabsContentProps) {
	return (
		<m.div
			role="tabpanel"
			data-slot="tabs-content"
			initial={{ opacity: 0, filter: "blur(4px)" }}
			animate={{ opacity: 1, filter: "blur(0px)" }}
			exit={{ opacity: 0, filter: "blur(4px)" }}
			transition={transition}
			className={cn("outline-none", className)}
			{...props}
		>
			{children}
		</m.div>
	);
}

export { Tabs, TabsContent, TabsContents, TabsHighlight, TabsHighlightItem, TabsList, TabsTrigger };
