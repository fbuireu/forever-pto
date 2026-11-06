"use client";

import { m, type Variants } from "motion/react";
import { type IconProps, IconWrapper, useAnimateIconContext } from "./Icon";

type ArrowUpProps = IconProps;

const variants = {
	group: {
		initial: {
			y: 0,
			transition: { ease: "easeInOut", duration: 0.3 },
		},
		animate: {
			y: "-25%",
			transition: { ease: "easeInOut", duration: 0.3 },
		},
	},
	path1: {},
	path2: {},
} satisfies Record<string, Variants>;

function IconComponent({ size, ...props }: ArrowUpProps) {
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
			<m.g variants={variants.group} initial="initial" animate={controls}>
				<m.path d="M12 19V5" variants={variants.path1} initial="initial" animate={controls} />
				<m.path d="m5 12 7-7 7 7" variants={variants.path2} initial="initial" animate={controls} />
			</m.g>
		</m.svg>
	);
}

function ArrowUp(props: ArrowUpProps) {
	return <IconWrapper icon={IconComponent} {...props} />;
}

export { ArrowUp };
