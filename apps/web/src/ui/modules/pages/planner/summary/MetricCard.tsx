import { SlidingNumber } from "@ui/modules/core/animate/text/SlidingNumber";
import { Badge } from "@ui/modules/core/primitives/Badge";
import { cn } from "@ui/utils/cn";
import type { LucideIcon } from "lucide-react";
import type { SVGMotionProps } from "motion/react";
import type { ComponentType, ReactNode } from "react";

export const MetricCardSize = {
	DEFAULT: "default",
	COMPACT: "compact",
} as const;

export type MetricCardSize = (typeof MetricCardSize)[keyof typeof MetricCardSize];

interface MetricCardBaseProps {
	label: string;
	value: string | number;
	icon:
		| LucideIcon
		| ComponentType<
				{
					size?: number;
					className?: string;
				} & Omit<SVGMotionProps<SVGSVGElement>, "animate">
		  >;
	colorScheme: keyof typeof COLOR_SCHEMES;
	className?: string;
	renderValue?: (counter: ReactNode) => ReactNode;
	decimalPlaces?: number;
}

interface DefaultMetricCardProps extends MetricCardBaseProps {
	size?: typeof MetricCardSize.DEFAULT;
	badge?: ReactNode;
	hint?: never;
}

interface CompactMetricCardProps extends MetricCardBaseProps {
	size: typeof MetricCardSize.COMPACT;
	hint?: string;
	badge?: never;
}

type MetricCardProps = DefaultMetricCardProps | CompactMetricCardProps;

const COLOR_SCHEMES = {
	blue: {
		bg: "bg-wash-teal",
		icon: "text-wash-teal-icon",
		text: "text-wash-teal-title",
		badge: "bg-wash-teal-badge text-[var(--color-brand-teal-deep)]",
	},
	green: {
		bg: "bg-wash-yellow",
		icon: "text-wash-yellow-icon",
		text: "text-wash-yellow-title",
		badge: "bg-wash-yellow-badge text-[var(--color-brand-yellow-deep)]",
	},
	purple: {
		bg: "bg-wash-purple",
		icon: "text-wash-purple-icon",
		text: "text-wash-purple-title",
		badge: "bg-wash-purple-badge text-[var(--color-brand-purple-deep)]",
	},
	amber: {
		bg: "bg-wash-orange-card",
		icon: "text-wash-orange-icon",
		text: "text-wash-orange-title",
		badge: "bg-wash-orange-badge text-[var(--color-brand-orange-deep)]",
	},
	emerald: {
		bg: "bg-wash-emerald",
		icon: "text-wash-emerald-icon",
		text: "text-wash-emerald-title",
		badge: "bg-wash-emerald-badge text-wash-emerald-badge-ink",
	},
	cyan: {
		bg: "bg-wash-cyan",
		icon: "text-wash-cyan-icon",
		text: "text-wash-cyan-title",
		badge: "bg-wash-cyan-badge text-wash-cyan-badge-ink",
	},
	violet: {
		bg: "bg-wash-violet",
		icon: "text-wash-violet-icon",
		text: "text-wash-violet-title",
		badge: "bg-wash-violet-badge text-wash-violet-badge-ink",
	},
	rose: {
		bg: "bg-wash-rose",
		icon: "text-wash-rose-icon",
		text: "text-wash-rose-title",
		badge: "bg-wash-rose-badge text-wash-rose-badge-ink",
	},
};

interface DisplayedParams {
	counter: ReactNode;
	renderValue?: (counter: ReactNode) => ReactNode;
}

const displayed = ({ counter, renderValue }: DisplayedParams) => (renderValue ? renderValue(counter) : counter);

export const MetricCard = (props: MetricCardProps) => {
	const { label, value, icon: Icon, colorScheme, renderValue, decimalPlaces = 0, className = "" } = props;
	const colors = COLOR_SCHEMES[colorScheme];

	if (props.size === MetricCardSize.COMPACT) {
		const { hint } = props;

		return (
			<div
				className={cn(
					"p-3",
					colors.bg,
					"rounded-[10px] border-[3px] border-[var(--frame)] text-center flex flex-col justify-between items-center shadow-[var(--shadow-brutal-sm)] [contain:layout]",
					className,
				)}
			>
				<Icon className={cn("size-4", colors.icon, "mx-auto mb-1")} />
				<div className={cn("text-lg font-display font-bold flex justify-center", renderValue && "gap-1", colors.text)}>
					{displayed({
						counter: (
							<SlidingNumber
								number={value}
								className={cn("text-lg font-display font-bold", colors.text)}
								decimalPlaces={decimalPlaces}
							/>
						),
						renderValue,
					})}
				</div>
				<div className={cn("text-xs", colors.text)}>{label}</div>
				{hint && <div className={cn("text-[0.65rem] opacity-70", colors.text)}>{hint}</div>}
			</div>
		);
	}

	const { badge } = props;

	return (
		<div
			className={cn(
				"items-center p-4",
				colors.bg,
				"rounded-[10px] border-[3px] border-[var(--frame)] flex flex-col justify-between items-center shadow-[var(--shadow-brutal-sm)] [contain:layout]",
				className,
			)}
		>
			<span className={cn("mb-1 text-[0.72rem] font-display font-black uppercase tracking-[0.08em]", colors.text)}>
				{label}
			</span>
			<div className={cn("flex items-center gap-2")}>
				<Icon className={cn("size-4", colors.icon)} />
				<span className={cn("text-xl font-display font-bold flex", renderValue && "gap-1", colors.text)}>
					{displayed({ counter: <SlidingNumber number={value} decimalPlaces={decimalPlaces} />, renderValue })}
				</span>
			</div>
			{badge && (
				<Badge
					variant="outline"
					className={cn(
						"mt-2 max-w-full whitespace-normal rounded-[14px] text-balance text-center text-xs leading-tight",
						colors.badge,
					)}
				>
					{badge}
				</Badge>
			)}
		</div>
	);
};
