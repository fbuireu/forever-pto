"use client";

import { useUIStore } from "@application/stores/ui";
import { Button } from "@ui/modules/core/primitives/Button";
import type { ComponentProps } from "react";

type QuickStartTriggerProps = Pick<ComponentProps<typeof Button>, "children" | "className" | "size" | "variant">;

export const QuickStartTrigger = ({ children, className, size, variant = "accent" }: QuickStartTriggerProps) => {
	const openQuickStart = useUIStore((state) => state.openQuickStart);

	return (
		<Button
			type="button"
			variant={variant}
			size={size}
			className={className}
			aria-haspopup="dialog"
			onClick={openQuickStart}
		>
			{children}
		</Button>
	);
};
