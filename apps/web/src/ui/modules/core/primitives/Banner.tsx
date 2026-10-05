import { cn } from "@ui/utils/cn";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "../animate/icons/Icon";

interface BannerProps {
	icon: LucideIcon | ComponentType<IconProps<never>>;
	title: string;
	children: ReactNode;
	action?: ReactNode;
	colorScheme: keyof typeof COLOR_SCHEMES;
	className?: string;
}

const COLOR_SCHEMES = {
	orange: {
		bg: "bg-wash-orange",
		icon: "text-wash-orange-icon",
		title: "text-wash-orange-title",
		message: "text-wash-orange-message",
	},
	blue: {
		bg: "bg-wash-teal",
		icon: "text-wash-teal-icon",
		title: "text-wash-teal-title",
		message: "text-wash-teal-message",
	},
	indigo: {
		bg: "bg-wash-purple",
		icon: "text-wash-purple-icon",
		title: "text-wash-purple-title",
		message: "text-wash-purple-message",
	},
	green: {
		bg: "bg-wash-green",
		icon: "text-wash-green-ink",
		title: "text-wash-green-ink",
		message: "text-wash-green-message",
	},
};

export const Banner = ({ icon: Icon, title, children, action, colorScheme, className = "" }: BannerProps) => {
	const colors = COLOR_SCHEMES[colorScheme];

	return (
		<div
			role="note"
			aria-label={title}
			className={cn(
				"rounded-[10px] border-[3px] border-[var(--frame)] p-4 shadow-[var(--shadow-brutal-sm)]",
				colors.bg,
				className,
			)}
		>
			<div className="flex items-center gap-2 mb-2">
				<Icon aria-hidden="true" className={cn("size-4 shrink-0", colors.icon)} />
				<span className={cn("text-[0.72rem] font-display font-black uppercase tracking-[0.08em]", colors.title)}>
					{title}
				</span>
			</div>
			<div className={cn("flex flex-wrap items-baseline gap-x-1 text-sm font-medium leading-snug", colors.message)}>
				{children}
			</div>
			{action && <div className="mt-3">{action}</div>}
		</div>
	);
};
