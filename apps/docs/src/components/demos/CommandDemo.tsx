import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ui/modules/core/primitives/Command";
import { Demo } from "../Demo";

const COUNTRIES = [
	{ value: "ES", label: "Spain" },
	{ value: "IT", label: "Italy" },
	{ value: "AD", label: "Andorra" },
];

export const CommandDemo = () => (
	<Demo>
		<Command className="w-full max-w-sm border-[3px] border-[var(--frame)] shadow-[var(--shadow-brutal-md)]">
			<CommandInput placeholder="Search a country…" />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup>
					{COUNTRIES.map((country) => (
						<CommandItem key={country.value} value={country.value} keywords={[country.label]}>
							{country.label}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	</Demo>
);
