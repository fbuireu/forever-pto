import { Button } from "@modules/components/core/button/Button";
import { Plus } from "lucide-react";
import { memo } from "react";

export const PlusButton = memo(({ onClick }: { onClick: () => void }) => (
	<Button variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={onClick}>
		<Plus />
		<span className="sr-only">Increase</span>
	</Button>
));
