"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { cn } from "@ui/utils/cn";
import { type HTMLMotionProps, m, type Transition } from "motion/react";
import { type ComponentProps, type ComponentPropsWithoutRef, isValidElement, type ReactElement } from "react";

type CollapsibleProps = ComponentProps<typeof CollapsiblePrimitive.Root>;

function Collapsible({ children, ...props }: CollapsibleProps) {
	return (
		<CollapsiblePrimitive.Root data-slot="collapsible" {...props}>
			{children}
		</CollapsiblePrimitive.Root>
	);
}

type CollapsibleTriggerProps = ComponentProps<typeof CollapsiblePrimitive.Trigger> & { asChild?: boolean };

function CollapsibleTrigger({ asChild, children, className, ...props }: CollapsibleTriggerProps) {
	if (asChild && isValidElement(children)) {
		return (
			<CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" render={children as ReactElement} {...props} />
		);
	}
	return (
		<CollapsiblePrimitive.Trigger
			data-slot="collapsible-trigger"
			className={cn(
				"relative hit-area-stable inline-flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border-[3px] border-(--frame) bg-(--surface-panel) px-3 py-2 text-sm font-semibold shadow-(--shadow-brutal-btn) outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-75 ease-linear",
				"hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-(--surface-panel-alt) hover:shadow-(--shadow-brutal-btn-hover)",
				"active:translate-x-0.5 active:translate-y-0.5 active:shadow-(--shadow-brutal-btn-active)",
				"aria-expanded:-translate-x-0.5 aria-expanded:-translate-y-0.5 aria-expanded:shadow-(--shadow-brutal-btn-hover)",
				"focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2",
				className,
			)}
			{...props}
		>
			{children}
		</CollapsiblePrimitive.Trigger>
	);
}

type CollapsibleContentProps = Omit<ComponentProps<typeof CollapsiblePrimitive.Panel>, "render"> &
	HTMLMotionProps<"div"> & {
		transition?: Transition;
	};

function CollapsibleContent({
	className,
	children,
	transition = { type: "spring", stiffness: 150, damping: 22 },
	...props
}: CollapsibleContentProps) {
	return (
		<CollapsiblePrimitive.Panel
			keepMounted
			data-slot="collapsible-content"
			render={(panelProps: ComponentPropsWithoutRef<"div"> & { hidden?: boolean }, state: { open: boolean }) => {
				const {
					hidden: _hidden,
					style,
					className: panelClassName,
					onDrag: _onDrag,
					onDragEnd: _onDragEnd,
					onDragStart: _onDragStart,
					onDragEnter: _onDragEnter,
					onDragLeave: _onDragLeave,
					onDragOver: _onDragOver,
					onDrop: _onDrop,
					onAnimationStart: _onAnimationStart,
					...restProps
				} = panelProps;
				return (
					<m.div
						{...restProps}
						layout
						animate={state.open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
						initial={false}
						transition={transition}
						aria-hidden={!state.open || undefined}
						className={cn("overflow-hidden", panelClassName, className)}
						style={{ display: "block", ...style }}
					>
						{children}
					</m.div>
				);
			}}
			{...(props as ComponentProps<typeof CollapsiblePrimitive.Panel>)}
		/>
	);
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
