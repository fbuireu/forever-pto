import { Lock } from "@ui/modules/core/animate/icons/Lock";
import { cn } from "@ui/utils/cn";

interface PremiumLockProps {
	className?: string;
	iconSize?: string;
}

export const PremiumLock = ({ className, iconSize = "size-6" }: PremiumLockProps) => (
	<span
		aria-hidden="true"
		data-slot="premium-lock"
		className={cn(
			"inline-flex items-center justify-center rounded-[8px] border-[3px] border-[var(--frame)] bg-background rotate-[-4deg] shadow-[var(--shadow-brutal-3)]",
			className,
		)}
	>
		<Lock className={cn(iconSize, "text-foreground")} />
	</span>
);
