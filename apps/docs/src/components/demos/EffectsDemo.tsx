import { AutoHeight } from "@ui/modules/core/animate/effects/AutoHeight";
import { MotionHighlight, MotionHighlightItem } from "@ui/modules/core/animate/effects/MotionHighlight";
import { Button } from "@ui/modules/core/primitives/Button";
import { useState } from "react";
import en from "../../../../web/src/ui/i18n/messages/en.json";
import { Demo } from "../Demo";

const THEMES = [en.theme.light, en.theme.dark, en.theme.system];

const SPRING = { type: "spring", stiffness: 350, damping: 35 } as const;

export const MotionHighlightChildrenDemo = () => (
	<Demo>
		<MotionHighlight hover className="rounded-lg border-2 border-[var(--frame)] bg-accent" transition={SPRING}>
			{THEMES.map((label) => (
				<MotionHighlightItem key={label} value={label}>
					<button type="button" className="cursor-pointer px-4 py-2 text-sm font-semibold">
						{label}
					</button>
				</MotionHighlightItem>
			))}
		</MotionHighlight>
	</Demo>
);

const { holidaysTable } = en;

const TABS = [
	{ value: "national", label: holidaysTable.nationalTab },
	{ value: "regional", label: holidaysTable.regionalTab },
	{ value: "custom", label: holidaysTable.customTab },
];

export const MotionHighlightParentDemo = () => {
	const [active, setActive] = useState<string>("national");

	return (
		<Demo>
			<MotionHighlight
				mode="parent"
				value={active}
				transition={SPRING}
				className="rounded-lg border-2 border-[var(--frame)] bg-accent"
				containerClassName="flex gap-1 rounded-xl border-[3px] border-[var(--frame)] bg-[var(--surface-panel-soft)] p-1"
			>
				{TABS.map(({ value, label }) => (
					<MotionHighlightItem key={value} value={value}>
						<button
							type="button"
							onClick={() => setActive(value)}
							className="cursor-pointer px-4 py-1.5 text-sm font-semibold"
						>
							{label}
						</button>
					</MotionHighlightItem>
				))}
			</MotionHighlight>
		</Demo>
	);
};

const SHORT_TEXT = "Pick a country and a number of PTO days.";
const LONG_TEXT =
	"Pick a country and a number of PTO days. The optimizer then scans the public holiday calendar, finds bridge days between holidays and weekends, and suggests the placement that turns the fewest PTO days into the longest continuous breaks.";

export const AutoHeightDemo = () => {
	const [expanded, setExpanded] = useState(false);

	return (
		<Demo>
			<div className="flex flex-col items-start gap-3">
				<Button size="sm" variant="outline" onClick={() => setExpanded((previous) => !previous)}>
					Toggle content
				</Button>
				<AutoHeight
					deps={[expanded]}
					transition={{ type: "spring", stiffness: 300, damping: 30, bounce: 0, restDelta: 0.01 }}
					className="w-80 overflow-hidden rounded-xl border-[3px] border-[var(--frame)] bg-card shadow-[var(--shadow-brutal-xs)]"
				>
					<p className="p-4 text-sm">{expanded ? LONG_TEXT : SHORT_TEXT}</p>
				</AutoHeight>
			</div>
		</Demo>
	);
};
