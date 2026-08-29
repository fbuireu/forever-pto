import { cn } from "@ui/utils/cn";
import type { ComponentProps } from "react";

type LabelProps = Omit<ComponentProps<"label">, "htmlFor"> & { htmlFor: string };

function Label({ className, htmlFor, children, ...props }: LabelProps) {
	return (
		<label
			htmlFor={htmlFor}
			className={cn(
				"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
				className,
			)}
			{...props}
		>
			{children}
		</label>
	);
}

export { Label };
