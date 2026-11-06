"use client";

import { m, type Variants } from "motion/react";
import { type IconProps, IconWrapper, useAnimateIconContext } from "./Icon";

type ChevronUpDownProps = IconProps;

const variants = {
	path1: {
		initial: {
			y: 0,
			transition: { duration: 0.3, ease: "easeInOut" },
		},
		animate: {
			y: 3,
			transition: { duration: 0.3, ease: "easeInOut" },
		},
	},
	path2: {
		initial: {
			y: 0,
			transition: { duration: 0.3, ease: "easeInOut" },
		},
		animate: {
			y: -3,
			transition: { duration: 0.3, ease: "easeInOut" },
		},
	},
} satisfies Record<string, Variants>;

function IconComponent({ size, ...props }: ChevronUpDownProps) {
	const { controls } = useAnimateIconContext();

	return (
		<m.svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<m.path d="m7 15 5 5 5-5" variants={variants.path1} initial="initial" animate={controls} />
			<m.path d="m7 9 5-5 5 5" variants={variants.path2} initial="initial" animate={controls} />
		</m.svg>
	);
}

function ChevronUpDown(props: ChevronUpDownProps) {
	return <IconWrapper icon={IconComponent} {...props} />;
}

export { ChevronUpDown };
