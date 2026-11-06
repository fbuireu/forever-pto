"use client";

import { AnimatePresence, m, type Transition } from "motion/react";

interface RotatingTextProps {
	text: string;
	transition?: Transition;
}

function RotatingText({ text, transition = { duration: 0.3, ease: "easeOut" } }: RotatingTextProps) {
	return (
		<div className="overflow-hidden py-1">
			<AnimatePresence mode="wait">
				<m.div
					key={text}
					transition={transition}
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -50 }}
				>
					{text}
				</m.div>
			</AnimatePresence>
		</div>
	);
}

export { RotatingText };
