import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@ui/modules/core/primitives/InputGroup";
import { Demo } from "../Demo";

export const InputGroupDemo = () => (
	<Demo className="flex-col items-stretch">
		<InputGroup>
			<InputGroupAddon>
				<InputGroupText>€</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput placeholder="Annual salary" aria-label="Annual salary" />
		</InputGroup>
		<InputGroup>
			<InputGroupAddon>
				<InputGroupText>$</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput placeholder="Donation amount" aria-invalid="true" aria-label="Invalid grouped input" />
		</InputGroup>
	</Demo>
);
