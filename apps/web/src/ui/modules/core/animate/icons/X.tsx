"use client";

import { m, type Variants } from "motion/react";
import { type IconProps, IconWrapper, useAnimateIconContext } from "./Icon";

type XProps = IconProps;

const variants = {
	line1: {
		initial: {
			rotate: 0,
			transition: { ease: "easeInOut", duration: 0.4 },
		},
		animate: {
			rotate: 90,
			transition: { ease: "easeInOut", duration: 0.4 },
		},
	},
	line2: {
		initial: {
			rotate: 0,
			transition: { ease: "easeInOut", duration: 0.4, delay: 0.1 },
		},
		animate: {
			rotate: 90,
			transition: { ease: "easeInOut", duration: 0.4, delay: 0.1 },
		},
	},
} satisfies Record<string, Variants>;

function IconComponent({ size, ...props }: XProps) {
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
			<m.line x1={6} y1={18} x2={18} y2={6} variants={variants.line1} initial="initial" animate={controls} />
			<m.line x1={6} y1={6} x2={18} y2={18} variants={variants.line2} initial="initial" animate={controls} />
		</m.svg>
	);
}

function X(props: XProps) {
	return <IconWrapper icon={IconComponent} {...props} />;
}

export { X };
