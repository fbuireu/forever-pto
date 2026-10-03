"use client";

import { Link } from "@application/i18n/navigation";
import { type QuickStartSource, useUIStore } from "@application/stores/ui";
import { useHasStoredPlan } from "@ui/hooks/useHasStoredPlan";
import { Button } from "@ui/modules/core/primitives/Button";
import type { ComponentProps, ReactNode } from "react";
import { PLANNER_PATH } from "./utils/helpers";

type QuickStartTriggerProps = Pick<ComponentProps<typeof Button>, "children" | "className" | "size" | "variant"> & {
	source: QuickStartSource;
	resumeLabel?: ReactNode;
};

export const QuickStartTrigger = ({
	children,
	className,
	size,
	variant = "accent",
	source,
	resumeLabel,
}: QuickStartTriggerProps) => {
	const openQuickStart = useUIStore((state) => state.openQuickStart);
	const hasStoredPlan = useHasStoredPlan();

	if (resumeLabel && hasStoredPlan) {
		return (
			<Button asChild variant={variant} size={size} className={className}>
				<Link href={PLANNER_PATH}>{resumeLabel}</Link>
			</Button>
		);
	}

	return (
		<Button
			type="button"
			variant={variant}
			size={size}
			className={className}
			aria-haspopup="dialog"
			onClick={() => openQuickStart(source)}
		>
			{children}
		</Button>
	);
};
