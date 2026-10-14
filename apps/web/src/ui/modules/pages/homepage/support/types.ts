import type { ReactNode } from "react";

interface FaqItem {
	id: string;
	question: string;
	answer: string | ReactNode;
}

interface FaqSection {
	id: string;
	title: string;
	items: FaqItem[];
}

export type FaqData = FaqSection[];
