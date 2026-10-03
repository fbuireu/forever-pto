"use client";

import {
	Tabs,
	TabsContent,
	TabsContents,
	TabsHighlight,
	TabsHighlightItem,
	TabsList,
	TabsTrigger,
} from "@ui/modules/core/animate/components/Tabs";
import { type ReactNode, useState } from "react";

type TabSection = {
	id: string;
	title: string;
	content: ReactNode;
};

type FaqTabsProps = {
	tabs: TabSection[];
};

export const FaqTabs = ({ tabs }: FaqTabsProps) => {
	const [active, setActive] = useState(tabs[0]?.id ?? "");

	return (
		<Tabs value={active} onValueChange={setActive}>
			<div className="overflow-x-auto">
				<TabsHighlight>
					<TabsList className="grid min-w-max w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
						{tabs.map((tab) => (
							<TabsHighlightItem key={tab.id} value={tab.id}>
								<TabsTrigger value={tab.id}>{tab.title}</TabsTrigger>
							</TabsHighlightItem>
						))}
					</TabsList>
				</TabsHighlight>
			</div>
			<TabsContents>
				{tabs.map((tab) => (
					<TabsContent key={tab.id} value={tab.id}>
						{tab.content}
					</TabsContent>
				))}
			</TabsContents>
		</Tabs>
	);
};
