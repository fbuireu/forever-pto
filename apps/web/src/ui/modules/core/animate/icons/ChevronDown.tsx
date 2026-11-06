"use client";

import { m, type Variants } from "motion/react";
import { type IconProps, IconWrapper, useAnimateIconContext } from "./Icon";

type ChevronDownProps = IconProps;

const variants = {
	path: {
		initial: {
			y: 0,
			transition: { duration: 0.3, ease: "easeInOut" },
		},
		animate: {
			y: 4,
			transition: { duration: 0.3, ease: "easeInOut" },
		},
	},
} satisfies Record<string, Variants>;

function IconComponent({ size, ...props }: ChevronDownProps) {
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
			<m.path d="m6 9 6 6 6-6" variants={variants.path} initial="initial" animate={controls} />
		</m.svg>
	);
}

function ChevronDown(props: ChevronDownProps) {
	return <IconWrapper icon={IconComponent} {...props} />;
}

export { ChevronDown };
