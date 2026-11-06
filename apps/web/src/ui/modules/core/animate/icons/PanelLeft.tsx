"use client";

import { m, type Variants } from "motion/react";
import { type IconProps, IconWrapper, useAnimateIconContext } from "./Icon";

type PanelLeftProps = IconProps;

const variants = {
	rect: {},
	line: {
		initial: { x1: 9, y1: 3, x2: 9, y2: 21 },
		animate: {
			x1: 7,
			y1: 3,
			x2: 7,
			y2: 21,
			transition: { type: "spring", damping: 20, stiffness: 200 },
		},
	},
} satisfies Record<string, Variants>;

function IconComponent({ size, ...props }: PanelLeftProps) {
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
			<m.rect
				width={18}
				height={18}
				x={3}
				y={3}
				rx={2}
				ry={2}
				variants={variants.rect}
				initial="initial"
				animate={controls}
			/>
			<m.line x1={9} y1={3} x2={9} y2={21} variants={variants.line} initial="initial" animate={controls} />
		</m.svg>
	);
}

function PanelLeft(props: PanelLeftProps) {
	return <IconWrapper icon={IconComponent} {...props} />;
}

export { PanelLeft as PanelLeftIcon };
