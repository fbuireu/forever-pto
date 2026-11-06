"use client";

import { m, type Variants } from "motion/react";
import { type IconProps, IconWrapper, useAnimateIconContext } from "./Icon";

type PlusProps = IconProps;

const variants = {
	line1: {
		initial: {
			rotate: 0,
			transition: { ease: "easeInOut", duration: 0.4, delay: 0.1 },
		},
		animate: {
			rotate: 90,
			transition: { ease: "easeInOut", duration: 0.4, delay: 0.1 },
		},
	},
	line2: {
		initial: {
			rotate: 0,
			transition: { ease: "easeInOut", duration: 0.4 },
		},
		animate: {
			rotate: 90,
			transition: { ease: "easeInOut", duration: 0.4 },
		},
	},
} satisfies Record<string, Variants>;

function IconComponent({ size, ...props }: PlusProps) {
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
			<m.line x1={12} y1={19} x2={12} y2={5} variants={variants.line1} initial="initial" animate={controls} />
			<m.line x1={5} y1={12} x2={19} y2={12} variants={variants.line2} initial="initial" animate={controls} />
		</m.svg>
	);
}

function Plus(props: PlusProps) {
	return <IconWrapper icon={IconComponent} {...props} />;
}

export { Plus };
