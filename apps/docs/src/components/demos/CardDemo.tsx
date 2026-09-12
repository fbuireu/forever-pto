import { Badge } from "@ui/modules/core/primitives/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/modules/core/primitives/Card";
import type { ComponentProps } from "react";
import { Demo } from "../Demo";
import { type OwnProps, propRows } from "../PropsTable";

export const CardDemo = () => (
	<Demo>
		<Card className="max-w-sm">
			<CardHeader>
				<CardTitle>Summer bridge</CardTitle>
				<CardDescription>4 PTO days connect two public holidays into a 9-day break.</CardDescription>
			</CardHeader>
			<CardContent className="flex items-center gap-3 text-sm">
				<Badge>9 days off</Badge>
				<span className="text-muted-foreground">efficiency ×2.25</span>
			</CardContent>
		</Card>
	</Demo>
);

export const CardPartsDemo = () => (
	<Demo>
		<Card className="max-w-sm">
			<CardHeader>
				<CardTitle>CardTitle</CardTitle>
				<CardDescription>CardDescription: muted, small.</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-sm">CardContent: the body area, padded to match the header.</p>
			</CardContent>
		</Card>
	</Demo>
);

export const CARD_TITLE_PROP_ROWS = propRows<OwnProps<ComponentProps<typeof CardTitle>, ComponentProps<"div">>>({
	as: {
		type: '"div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"',
		defaultValue: '"div"',
		description:
			"The element the title renders as. Pick a heading level when the card is a section of the page, so the outline stays meaningful.",
	},
});
