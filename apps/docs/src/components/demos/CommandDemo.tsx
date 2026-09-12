import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ui/modules/core/primitives/Command";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const CommandDemo = () => (
	<Demo>
		<Command className="w-full max-w-sm border-[3px] border-[var(--frame)] shadow-[var(--shadow-brutal-md)]">
			<CommandInput placeholder="Search a country…" />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Countries">
					<CommandItem>Spain</CommandItem>
					<CommandItem>Italy</CommandItem>
					<CommandItem>Andorra</CommandItem>
				</CommandGroup>
				<CommandGroup heading="Regions">
					<CommandItem>Catalonia</CommandItem>
					<CommandItem>Lombardy</CommandItem>
					<CommandItem disabled>Atlantis (disabled)</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	</Demo>
);

export const COMMAND_PROP_ROWS = propRows({
	value: {
		type: "string",
		description: "The currently highlighted item's value, controlled. cmdk manages it uncontrolled otherwise.",
	},
	onValueChange: {
		type: "(value: string) => void",
		description: "Fires when the highlighted item changes, by keyboard or pointer.",
	},
	filter: {
		type: "(value: string, search: string, keywords?: string[]) => number",
		description: "Replace cmdk's fuzzy scorer. Return 0 to hide an item.",
	},
	shouldFilter: {
		type: "boolean",
		defaultValue: "true",
		description: "Set false when the list is already filtered by the caller, for a server-driven search.",
	},
	loop: {
		type: "boolean",
		defaultValue: "false",
		description: "Whether arrow keys wrap from the last item to the first.",
	},
});
