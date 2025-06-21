import { Separator } from "@ui/modules/components/core/separator/Separator";

interface StatsDisabledProps {
	message: string;
}

export const StatsDisabled = ({ message }: StatsDisabledProps) => (
	<>
		<Separator />
		<div className="text-sm text-slate-700 dark:text-slate-300">
			<p className="italic">{message}</p>
		</div>
	</>
);
