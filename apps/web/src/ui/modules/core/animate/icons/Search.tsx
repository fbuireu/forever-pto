"use client";

import { m, type Variants } from "motion/react";
import { type IconProps, IconWrapper, useAnimateIconContext } from "./Icon";

type SearchProps = IconProps;

const variants = {
	group: {
		initial: {
			rotate: 0,
		},
		animate: {
			transformOrigin: "bottom right",
			rotate: [0, 17, -10, 5, -1, 0],
			transition: { duration: 0.8, ease: "easeInOut" },
		},
	},
	path: {},
	circle: {},
} satisfies Record<string, Variants>;

function IconComponent({ size, ...props }: SearchProps) {
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
			variants={variants.group}
			initial="initial"
			animate={controls}
			{...props}
		>
			<m.path d="m21 21-4.34-4.34" variants={variants.path} initial="initial" animate={controls} />
			<m.circle cx={11} cy={11} r={8} variants={variants.circle} initial="initial" animate={controls} />
		</m.svg>
	);
}

function Search(props: SearchProps) {
	return <IconWrapper icon={IconComponent} {...props} />;
}

export { Search, Search as SearchIcon };
