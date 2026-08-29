import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui/modules/core/animate/base/Collapsible";
import { Button } from "@ui/modules/core/primitives/Button";
import { Demo } from "../Demo";

export const CollapsibleDemo = () => (
	<Demo>
		<Collapsible className="w-full max-w-md">
			<CollapsibleTrigger>Advanced options</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="space-y-2 px-3 py-4 text-sm text-muted-foreground">
					<p className="m-0">Carryover months, past months and other knobs live behind this fold.</p>
					<p className="m-0">While open, the trigger keeps its lifted pressed style via aria-expanded.</p>
				</div>
			</CollapsibleContent>
		</Collapsible>
	</Demo>
);

export const CollapsibleAsChildDemo = () => (
	<Demo>
		<Collapsible className="w-full max-w-md">
			<CollapsibleTrigger asChild>
				<Button variant="accent">Custom trigger via asChild</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<p className="m-0 py-4 text-sm text-muted-foreground">
					With asChild the default brutal trigger styling is skipped and your element is used instead.
				</p>
			</CollapsibleContent>
		</Collapsible>
	</Demo>
);
