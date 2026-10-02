import { cn } from "@ui/utils/cn";
import type { ComponentProps } from "react";

function Card({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			data-slot="card"
			className={cn(
				"bg-card text-card-foreground flex flex-col gap-6 rounded-[14px] border-[3px] border-[var(--frame)] py-6 shadow-[var(--shadow-brutal-md)] overflow-hidden",
				className,
			)}
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			data-slot="card-header"
			className={cn(
				"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
				className,
			)}
			{...props}
		/>
	);
}

type CardTitleElement = "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface CardTitleProps extends ComponentProps<"div"> {
	as?: CardTitleElement;
}

function CardTitle({ as: Element = "div", className, ...props }: CardTitleProps) {
	return (
		<Element
			data-slot="card-title"
			className={cn("leading-none font-black tracking-[-0.03em]", className)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
	return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
	return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
