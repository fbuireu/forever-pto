import { cn } from "@ui/utils/cn";
import type { ComponentProps } from "react";

interface LabelProps extends Omit<ComponentProps<"label">, "htmlFor"> {
	htmlFor: string;
}

function Label({ className, htmlFor, children, ...props }: LabelProps) {
	return (
		<label htmlFor={htmlFor} className={cn("text-sm font-medium leading-none", className)} {...props}>
			{children}
		</label>
	);
}

export { Label };
