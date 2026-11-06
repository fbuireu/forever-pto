"use client";

import { useAutoHeight } from "@ui/hooks/useAutoHeight";
import { type HTMLMotionProps, m } from "motion/react";
import type { DependencyList, ReactNode } from "react";

interface AutoHeightProps extends Omit<HTMLMotionProps<"div">, "children" | "animate" | "style"> {
	children: ReactNode;
	deps: DependencyList;
}

function AutoHeight({ children, deps, ...props }: AutoHeightProps) {
	const { ref, height } = useAutoHeight<HTMLDivElement>(deps);

	return (
		<m.div animate={{ height }} {...props}>
			<div ref={ref}>{children}</div>
		</m.div>
	);
}

export { AutoHeight };
