import { Counter } from "@ui/modules/core/animate/components/Counter";
import { FeatureList } from "@ui/modules/core/animate/components/FeatureList";
import { RadialNav } from "@ui/modules/core/animate/components/RadialNav";
import { CircleCheckBig } from "@ui/modules/core/animate/icons/CircleCheckBig";
import { Clock } from "@ui/modules/core/animate/icons/Clock";
import { Circle, Sparkles } from "lucide-react";
import { type ComponentProps, useState } from "react";
import en from "../../../../web/src/ui/i18n/messages/en.json";
import { Demo } from "../Demo";

const { features: ROADMAP_FEATURES } = en.roadmap;

export const CounterDemo = () => {
	const [days, setDays] = useState(23);

	return (
		<Demo>
			<Counter
				number={days}
				setNumber={setDays}
				label={en.ptoDays.days}
				decrementLabel={en.ptoDays.decrease}
				incrementLabel={en.ptoDays.increase}
				decrementButtonProps={{ disabled: days <= 0 }}
				incrementButtonProps={{ disabled: days >= 60 }}
			/>
		</Demo>
	);
};

const FEATURES = [
	{
		id: "1",
		title: ROADMAP_FEATURES.corePtoCalculator,
		description: ROADMAP_FEATURES.corePtoCalculatorDescription,
		quarter: "Q3 2025",
	},
	{
		id: "2",
		title: ROADMAP_FEATURES.multipleCountries,
		description: ROADMAP_FEATURES.multipleCountriesDescription,
		quarter: "Q3 2025",
	},
	{
		id: "4",
		title: ROADMAP_FEATURES.customHolidays,
		description: ROADMAP_FEATURES.customHolidaysDescription,
		quarter: "Q4 2025",
	},
];

export const FeatureListDemo = () => (
	<Demo>
		<div className="w-full max-w-sm">
			<FeatureList
				features={FEATURES}
				categoryLabel={en.roadmap.completed}
				detailedViewLabel={en.roadmap.detailedView}
			/>
		</div>
	</Demo>
);

const NAV_ITEMS: ComponentProps<typeof RadialNav>["items"] = [
	{
		id: 1,
		icon: CircleCheckBig,
		animateOnHover: true,
		label: en.roadmap.completed,
		angle: 0,
		className: "text-positive-base",
		badgeClass: "bg-[var(--color-brand-green)] text-[var(--color-brand-ink)] border-[var(--frame)]",
	},
	{
		id: 2,
		icon: Clock,
		animateOnHover: true,
		label: en.roadmap.inProgress,
		angle: 90,
		className: "text-info-base",
		badgeClass: "bg-[var(--color-brand-sky)] text-[var(--color-brand-ink)] border-[var(--frame)]",
	},
	{
		id: 3,
		icon: Circle,
		label: en.roadmap.planned,
		angle: 180,
		className: "text-warning-base",
		badgeClass: "bg-[var(--color-brand-orange)] text-[var(--color-brand-ink)] border-[var(--frame)]",
	},
	{
		id: 4,
		icon: Sparkles,
		label: en.roadmap.future,
		angle: 270,
		className: "text-efficiency-base",
		badgeClass: "bg-[var(--color-brand-purple)] text-on-fill border-[var(--frame)]",
	},
];

export const RadialNavDemo = () => (
	<Demo>
		<div className="relative mx-auto flex aspect-square w-full max-w-80 items-center justify-center">
			<RadialNav
				items={NAV_ITEMS}
				defaultActiveId={1}
				onActiveChange={() => undefined}
				aria-label="Feature navigation"
			/>
		</div>
	</Demo>
);
