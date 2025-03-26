import { Loader2 } from "lucide-react";

export const Spinner = () => (
	<div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 opacity-10">
		<Loader2 className="h-10 w-10 animate-spin text-primary" />
	</div>
);
