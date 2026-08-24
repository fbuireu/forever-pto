"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

const loadFeatures = () => import("motion/react").then((res) => res.domAnimation);

export function LazyMotionProvider({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<LazyMotion features={loadFeatures}>
			<MotionConfig reducedMotion="user">{children}</MotionConfig>
		</LazyMotion>
	);
}
