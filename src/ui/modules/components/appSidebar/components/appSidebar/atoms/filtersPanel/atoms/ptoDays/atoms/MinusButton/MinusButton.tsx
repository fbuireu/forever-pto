import { Button } from "@modules/components/core/button/Button";
import { Minus } from "lucide-react";
import { memo } from "react";

export const MinusButton = memo(({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => (
	<Button variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={onClick} disabled={disabled}>
		<Minus />
		<span className="sr-only">Decrease</span>
	</Button>
));
