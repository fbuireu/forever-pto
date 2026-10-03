import { cn } from "@ui/utils/cn";

interface BoneProps {
	className?: string;
}

export function Bone({ className }: BoneProps) {
	return (
		<div
			className={cn("rounded-[8px] border-[2px] border-[var(--frame)]/30 bg-[var(--surface-panel-soft)]", className)}
		/>
	);
}
