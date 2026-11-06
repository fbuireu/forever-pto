"use client";

import { m, type Variants } from "motion/react";
import { type IconProps, IconWrapper, useAnimateIconContext } from "./Icon";

type UsersProps = IconProps;

const variants = {
	path1: {
		initial: {
			y: 0,
		},
		animate: {
			y: [0, 2, -2, 0],
			transition: {
				duration: 0.6,
				ease: "easeInOut",
				delay: 0.1,
			},
		},
	},
	path2: {
		initial: {
			y: 0,
		},
		animate: {
			y: [0, 4, -2, 0],
			transition: {
				duration: 0.6,
				ease: "easeInOut",
			},
		},
	},
	path3: {
		initial: {
			y: 0,
		},
		animate: {
			y: [0, 2, -2, 0],
			transition: {
				duration: 0.6,
				ease: "easeInOut",
			},
		},
	},
	circle: {
		initial: {
			y: 0,
		},
		animate: {
			y: [0, 4, -2, 0],
			transition: {
				duration: 0.6,
				ease: "easeInOut",
				delay: 0.1,
			},
		},
	},
} satisfies Record<string, Variants>;

function IconComponent({ size, ...props }: UsersProps) {
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
			<m.path
				d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
				variants={variants.path1}
				initial="initial"
				animate={controls}
			/>
			<m.path d="M16 3.128a4 4 0 0 1 0 7.744" variants={variants.path2} initial="initial" animate={controls} />
			<m.path d="M22 21v-2a4 4 0 0 0-3-3.87" variants={variants.path3} initial="initial" animate={controls} />
			<m.circle cx={9} cy={7} r={4} variants={variants.circle} initial="initial" animate={controls} />
		</m.svg>
	);
}

function Users(props: UsersProps) {
	return <IconWrapper icon={IconComponent} {...props} />;
}

export { Users };
