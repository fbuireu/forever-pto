import { mergeClasses } from "@ui/utils/mergeClasses";
import type { HTMLAttributes } from "react";

export const CommandShortcut = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span className={mergeClasses("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />
	);
};
