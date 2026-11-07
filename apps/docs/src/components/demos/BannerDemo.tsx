import { Banner } from "@ui/modules/core/primitives/Banner";
import { CalendarDays, type LucideIcon, MapPin, Zap } from "lucide-react";
import type { ComponentProps } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";
import type { VariantRow } from "../VariantsTable";

type BannerColorScheme = ComponentProps<typeof Banner>["colorScheme"];

const SCHEME_EXAMPLES: Record<BannerColorScheme, { icon: LucideIcon; title: string; message: string }> = {
	orange: {
		icon: Zap,
		title: "You can improve",
		message: "There are alternatives that add 2 more days to your suggestion.",
	},
	blue: {
		icon: MapPin,
		title: "Add your region",
		message: "Select your region in the sidebar to include regional holidays and squeeze out even more effective days.",
	},
	indigo: {
		icon: CalendarDays,
		title: "Manual adjustments",
		message: "You added 3 days to the original suggestion.",
	},
};

const SCHEMES = Object.keys(SCHEME_EXAMPLES) as BannerColorScheme[];

export const BANNER_SCHEME_ROWS: VariantRow[] = [
	{
		axis: "colorScheme",
		values: SCHEMES,
		notes: "Required prop, no default. Each scheme maps to a set of wash tokens with light and dark values.",
	},
];

export const BannerSchemesDemo = () => (
	<Demo className="flex-col items-stretch">
		{SCHEMES.map((scheme) => {
			const { icon, title, message } = SCHEME_EXAMPLES[scheme];
			return (
				<Banner key={scheme} colorScheme={scheme} icon={icon} title={title}>
					{message}
				</Banner>
			);
		})}
	</Demo>
);

const ACTION_CLASS =
	"hit-area-stable inline-flex cursor-pointer items-center justify-center gap-2 rounded-[8px] border-[3px] border-[var(--frame)] bg-[var(--color-brand-orange)] px-4 py-2 text-sm font-black text-[var(--color-brand-ink)] shadow-[var(--shadow-brutal-btn)] transition-[transform,box-shadow] duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)]";

export const BannerActionDemo = () => (
	<Demo className="flex-col items-stretch">
		<Banner
			colorScheme="orange"
			icon={Zap}
			title="You can improve"
			action={
				<button type="button" className={ACTION_CLASS}>
					Review the alternatives.
				</button>
			}
		>
			There are alternatives that add 2 more days to your suggestion.
		</Banner>
	</Demo>
);

export const BANNER_PROP_ROWS = propRows<keyof ComponentProps<typeof Banner>>({
	icon: {
		type: "LucideIcon | ComponentType<IconProps>",
		description:
			"The icon drawn beside the title, a lucide icon or one of the animated icons. Rendered aria-hidden; the title carries the meaning.",
	},
	title: { type: "string", description: "Uppercase heading of the callout and its accessible name." },
	children: { type: "ReactNode", description: "The message body." },
	action: {
		type: "ReactNode",
		description: "An optional control rendered after the message, as the Summary does with a link or button.",
	},
	colorScheme: {
		type: SCHEMES.map((scheme) => `"${scheme}"`).join(" | "),
		description:
			"Brand tint of the surface, icon and title. Required: a Banner without a scheme has no meaning to convey.",
	},
	className: { type: "string", defaultValue: '""', description: "Extra classes on the outer box." },
});
