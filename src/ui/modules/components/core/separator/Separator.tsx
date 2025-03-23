"use client";

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { mergeClasses } from '@shared/ui/utils/mergeClasses';
import type { ComponentProps } from 'react';

export const Separator = ({
	className,
	orientation = "horizontal",
	decorative = true,
	...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) => (
	<SeparatorPrimitive.Root
		data-slot="separator-root"
		decorative={decorative}
		orientation={orientation}
		className={mergeClasses(
			"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
			className,
		)}
		{...props}
	/>
);
