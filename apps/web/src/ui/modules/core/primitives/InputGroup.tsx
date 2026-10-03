"use client";

import { cn } from "@ui/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Input } from "./Input";

function InputGroup({ className, ...props }: ComponentProps<"div">) {
	return (
		// biome-ignore lint/a11y/useSemanticElements: UI library component, role=group on div is intentional
		<div
			data-slot="input-group"
			role="group"
			className={cn(
				"group/input-group relative flex w-full items-center rounded-[8px] border-[3px] border-[var(--frame)] bg-input transition-[box-shadow,transform] duration-75 ease-linear outline-none",
				"h-11 has-[>textarea]:h-auto",
				"hover:shadow-[var(--shadow-brutal-xs)]",
				"has-[>[data-align=inline-start]]:[&>input]:pl-2",
				"has-[>[data-align=inline-end]]:[&>input]:pr-2",
				"has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
				"has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",
				"has-[[data-slot=input-group-control]:focus-visible]:shadow-[var(--shadow-brutal-sm)]",
				"has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:shadow-none has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:shadow-[var(--shadow-brutal-sm-destructive)]",

				className,
			)}
			{...props}
		/>
	);
}

const inputGroupAddonVariants = cva(
	"text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none [&>svg:not([class*='size-'])]:size-4 [&>kbd]:rounded-[calc(var(--radius)-5px)] group-data-[disabled=true]/input-group:opacity-50",
	{
		variants: {
			align: {
				"inline-start": "order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
				"inline-end": "order-last pr-3 has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]",
				"block-start":
					"order-first w-full justify-start px-3 pt-3 [.border-b]:pb-3 group-has-[>input]/input-group:pt-2.5",
				"block-end": "order-last w-full justify-start px-3 pb-3 [.border-t]:pt-3 group-has-[>input]/input-group:pb-2.5",
			},
		},
		defaultVariants: {
			align: "inline-start",
		},
	},
);

function InputGroupAddon({
	className,
	align = "inline-start",
	...props
}: ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: click-to-focus is cosmetic mouse UX; keyboard/AT users access the inner input directly
		<div
			data-slot="input-group-addon"
			data-align={align}
			className={cn(inputGroupAddonVariants({ align }), className)}
			onClick={(e) => {
				if ((e.target as HTMLElement).closest("button")) {
					return;
				}
				e.currentTarget.parentElement?.querySelector("input")?.focus();
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					if ((e.target as HTMLElement).closest("button")) return;
					e.currentTarget.parentElement?.querySelector("input")?.focus();
				}
			}}
			{...props}
		/>
	);
}

function InputGroupText({ className, ...props }: ComponentProps<"span">) {
	return (
		<span
			className={cn(
				"text-muted-foreground flex items-center gap-2 text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	);
}

function InputGroupInput({ className, ...props }: ComponentProps<"input">) {
	return (
		<Input
			data-slot="input-group-control"
			className={cn("flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0", className)}
			{...props}
		/>
	);
}

export { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText };
