import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const skeletonVariants = cva("animate-pulse rounded-md bg-muted", {
	variants: {
		variant: {
			default: "bg-muted",
			card: "bg-card",
			text: "bg-muted-foreground/20",
		},
		size: {
			sm: "h-4",
			md: "h-6",
			lg: "h-8",
			xl: "h-12",
			"2xl": "h-16",
			"3xl": "h-24",
			"4xl": "h-32",
			"5xl": "h-40",
			"6xl": "h-48",
			"7xl": "h-56",
			"8xl": "h-64",
			"9xl": "h-72",
			"10xl": "h-80",
			"11xl": "h-96",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "md",
	},
});

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {
	width?: string | number;
	height?: string | number;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
	({ className, variant, size, width, height, ...props }, ref) => {
		const style = {
			width: width,
			height: height,
		};

		return (
			<div
				className={mergeClasses(skeletonVariants({ variant, size }), className)}
				ref={ref}
				style={style}
				{...props}
			/>
		);
	},
);

Skeleton.displayName = "Skeleton";

export { Skeleton, skeletonVariants };
