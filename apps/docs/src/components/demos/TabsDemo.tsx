import {
	Tabs,
	TabsContent,
	TabsContents,
	TabsHighlight,
	TabsHighlightItem,
	TabsList,
	TabsTrigger,
} from "@ui/modules/core/animate/components/Tabs";
import type { ComponentProps } from "react";
import { FilterStrategy } from "../../../../web/src/domain/calendar/types";
import en from "../../../../web/src/ui/i18n/messages/en.json";
import { Demo } from "../Demo";
import { type OwnProps, propRows } from "../PropsTable";

const TABS = Object.values(FilterStrategy).map((id) => ({
	id,
	label: en.sidebar.strategy[id].label,
	content: en.sidebar.strategy[id].subtitle,
}));

export const TabsDemo = () => (
	<Demo>
		<Tabs defaultValue={TABS[0].id} className="w-full max-w-md">
			<TabsHighlight>
				<TabsList>
					{TABS.map((tab) => (
						<TabsHighlightItem key={tab.id} value={tab.id}>
							<TabsTrigger value={tab.id}>{tab.label}</TabsTrigger>
						</TabsHighlightItem>
					))}
				</TabsList>
			</TabsHighlight>
			<TabsContents>
				{TABS.map((tab) => (
					<TabsContent key={tab.id} value={tab.id} className="py-2 text-sm text-muted-foreground">
						{tab.content}
					</TabsContent>
				))}
			</TabsContents>
		</Tabs>
	</Demo>
);

export const TABS_PROP_ROWS = propRows<
	OwnProps<ComponentProps<typeof Tabs>, Omit<ComponentProps<"div">, "defaultValue">>
>({
	value: { type: "string", description: "Controlled active tab." },
	defaultValue: {
		type: "string",
		description: "Uncontrolled initial tab. Without either, no panel renders until a tab is clicked.",
	},
	onValueChange: {
		type: "(value: string) => void",
		description: "Fires when a tab is activated by click or keyboard.",
	},
});

export const TABS_CONTENTS_PROP_ROWS = propRows({
	mode: {
		type: '"auto-height" | "layout"',
		defaultValue: '"auto-height"',
		description:
			"How the container follows the active panel's height: measured and animated by AutoHeight, or a Motion layout animation.",
	},
	transition: { type: "Transition", description: "Transition of the height change and of the panel cross-fade." },
});

export const TABS_HIGHLIGHT_PROP_ROWS = propRows({
	activeClassName: { type: "string", description: "Classes on the gliding pill." },
	transition: {
		type: "Transition",
		defaultValue: '{ type: "spring", stiffness: 200, damping: 25 }',
		description: "Spring the pill moves with.",
	},
});
