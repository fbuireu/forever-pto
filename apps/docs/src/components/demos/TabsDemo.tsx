import {
	Tabs,
	TabsContent,
	TabsContents,
	TabsHighlight,
	TabsHighlightItem,
	TabsList,
	TabsTrigger,
} from "@ui/modules/core/animate/components/Tabs";
import { useState } from "react";
import en from "../../../../web/src/ui/i18n/messages/en.json";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

const { holidaysTable } = en;

const TABS = [
	{ id: "national", label: holidaysTable.nationalTab, content: holidaysTable.nationalTitle, disabled: false },
	{ id: "regional", label: holidaysTable.regionalTab, content: holidaysTable.regionalTitle, disabled: true },
	{ id: "custom", label: holidaysTable.customTab, content: holidaysTable.customTitle, disabled: false },
];

export const TabsDemo = () => {
	const [active, setActive] = useState<string>(TABS[0].id);

	return (
		<Demo>
			<Tabs value={active} onValueChange={setActive}>
				<TabsHighlight>
					<TabsList>
						{TABS.map((tab) => (
							<TabsHighlightItem key={tab.id} value={tab.id}>
								<TabsTrigger value={tab.id} disabled={tab.disabled}>
									{tab.label}
								</TabsTrigger>
							</TabsHighlightItem>
						))}
					</TabsList>
				</TabsHighlight>
				<TabsContents>
					{TABS.map((tab) => (
						<TabsContent key={tab.id} value={tab.id}>
							<p className="m-0 py-2 text-sm text-muted-foreground">{tab.content}</p>
						</TabsContent>
					))}
				</TabsContents>
			</Tabs>
		</Demo>
	);
};

export const TABS_PROP_ROWS = propRows({
	value: { type: "string", description: "The active tab. Required: the component keeps no state of its own." },
	onValueChange: {
		type: "(value: string) => void",
		description: "Fires when a tab is activated by click or keyboard.",
	},
});
