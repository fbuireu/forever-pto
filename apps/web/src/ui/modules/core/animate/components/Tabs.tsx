"use client";

import { cn } from "@ui/utils/cn";
import { AnimatePresence, m } from "motion/react";
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
	useId,
	useMemo,
} from "react";
import { AutoHeight } from "../effects/AutoHeight";
import { MotionHighlight, MotionHighlightItem } from "../effects/MotionHighlight";

interface TabsContextType {
	activeValue: string;
	handleValueChange: (value: string) => void;
	triggerId: (value: string) => string;
	panelId: (value: string) => string;
}

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

const activateSiblingTab = ({ from, key }: ActivateSiblingTabParams): boolean => {
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

function useTabs(): TabsContextType {
	const ctx = use(TabsContext);
	if (!ctx) throw new Error("useTabs must be used within a Tabs");
	return ctx;
}

interface TabsProps {
	value: string;
	onValueChange: (value: string) => void;
	children: ReactNode;
}

function Tabs({ value, onValueChange, children }: TabsProps) {
	const baseId = useId();

	const contextValue = useMemo(
		() => ({
			activeValue: value,
			handleValueChange: onValueChange,
			triggerId: (val: string) => `${baseId}tab-${val}`,
			panelId: (val: string) => `${baseId}panel-${val}`,
		}),
		[value, onValueChange, baseId],
	);

	return (
		<TabsContext value={contextValue}>
			<div data-slot="tabs" className="flex flex-col gap-2">
				{children}
			</div>
		</TabsContext>
	);
}

interface TabsHighlightProps {
	children: ReactNode;
}

function TabsHighlight({ children }: Readonly<TabsHighlightProps>) {
	const { activeValue } = useTabs();

	return (
		<MotionHighlight
			mode="parent"
			className="rounded-md bg-accent border-2 border-(--frame) shadow-(--shadow-brutal-xs)"
			value={activeValue}
			transition={{ type: "spring", stiffness: 200, damping: 25 }}
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

interface TabsHighlightItemProps {
	value: string;
	children: ReactElement;
}

function TabsHighlightItem({ value, children }: Readonly<TabsHighlightItemProps>) {
	return (
		<MotionHighlightItem value={value} className="size-full">
			{children}
		</MotionHighlightItem>
	);
}

interface TabsTriggerProps {
	value: string;
	children: ReactNode;
	disabled?: boolean;
}

function TabsTrigger({ value, children, disabled }: TabsTriggerProps) {
	const { activeValue, handleValueChange, triggerId, panelId } = useTabs();
	const isActive = activeValue === value;

	const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (activateSiblingTab({ from: event.currentTarget, key: event.key })) event.preventDefault();
	};

	return (
		<m.button
			data-slot="tabs-trigger"
			role="tab"
			id={triggerId(value)}
			aria-selected={isActive}
			aria-controls={isActive ? panelId(value) : undefined}
			tabIndex={isActive ? 0 : -1}
			whileTap={{ scale: 0.95 }}
			onClick={() => handleValueChange(value)}
			onKeyDown={handleKeyDown}
			disabled={disabled}
			data-state={isActive ? "active" : "inactive"}
			className="inline-flex cursor-pointer items-center size-full justify-center whitespace-nowrap rounded-sm px-2 py-1 text-sm font-medium transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-accent-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground relative z-1"
		>
			{children}
		</m.button>
	);
}

interface TabsContentsProps {
	children: ReactNode;
	className?: string;
}

function TabsContents({ children, className }: TabsContentsProps) {
	const { activeValue } = useTabs();
	const activeChild = Children.toArray(children).find(
		(child): child is ReactElement<TabsContentProps> =>
			isValidElement<TabsContentProps>(child) && child.props.value === activeValue,
	);

	return (
		<AutoHeight
			data-slot="tabs-contents"
			className={className}
			deps={[activeValue]}
			transition={{ type: "spring", stiffness: 200, damping: 25 }}
		>
			<AnimatePresence initial={false} mode="wait">
				{activeChild ? cloneElement(activeChild, { key: activeValue }) : null}
			</AnimatePresence>
		</AutoHeight>
	);
}

interface TabsContentProps {
	value: string;
	children: ReactNode;
}

function TabsContent({ value, children }: TabsContentProps) {
	const { triggerId, panelId } = useTabs();

	return (
		<m.div
			role="tabpanel"
			id={panelId(value)}
			aria-labelledby={triggerId(value)}
			data-slot="tabs-content"
			initial={{ opacity: 0, filter: "blur(4px)" }}
			animate={{ opacity: 1, filter: "blur(0px)" }}
			exit={{ opacity: 0, filter: "blur(4px)" }}
			transition={{ duration: 0.22, ease: "easeOut" }}
			className="outline-none"
		>
			{children}
		</m.div>
	);
}

export { Tabs, TabsContent, TabsContents, TabsHighlight, TabsHighlightItem, TabsList, TabsTrigger };
