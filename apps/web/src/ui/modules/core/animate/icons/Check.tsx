"use client";

import { m, type Variants } from "motion/react";
import { type IconProps, IconWrapper, useAnimateIconContext } from "./Icon";

type CheckProps = IconProps;

const variants = {
	path: {
		initial: {
			pathLength: 1,
			opacity: 1,
			scale: 1,
		},
		animate: {
			pathLength: [0, 1],
			opacity: [0, 1],
			scale: [1, 1.1, 1],
			transition: {
				duration: 0.6,
				ease: "easeInOut",
			},
		},
	},
} satisfies Record<string, Variants>;

function IconComponent({ size, ...props }: CheckProps) {
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
			initial="initial"
			animate={controls}
			{...props}
		>
			<m.path d="m4 12 5 5L20 6" variants={variants.path} initial="initial" animate={controls} />
		</m.svg>
	);
}

function Check(props: CheckProps) {
	return <IconWrapper icon={IconComponent} {...props} />;
}

export { Check };
