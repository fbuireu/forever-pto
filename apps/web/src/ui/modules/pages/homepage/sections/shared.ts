export type DayType = "work" | "holiday" | "pto" | "weekend";

export const SHOWCASE_PLAN = { ptoDays: 22, effectiveDays: 74, holidays: 12 } as const;

export const SHOWCASE_EFFICIENCY = SHOWCASE_PLAN.effectiveDays / SHOWCASE_PLAN.ptoDays;

export const COUNTRY_COUNT = 205;

const CAL_PATTERN: DayType[] = [
	"work",
	"work",
	"work",
	"holiday",
	"pto",
	"weekend",
	"weekend",
	"work",
	"work",
	"work",
	"work",
	"work",
	"weekend",
	"weekend",
	"holiday",
	"pto",
	"work",
	"work",
	"work",
	"weekend",
	"weekend",
	"work",
	"work",
	"work",
	"pto",
	"holiday",
	"weekend",
	"weekend",
];

export const CAL_ENTRIES = CAL_PATTERN.map((type, i) => ({ id: `d${i + 1}`, type }));

export const dayCell: Record<DayType, string> = {
	work: "rounded-lg bg-card text-foreground border-[2px] border-[var(--frame)]/15",
	holiday:
		"rounded-lg bg-[image:var(--holiday-fill)] text-[var(--color-brand-ink)] font-black border-[2px] border-[var(--frame)]",
	pto: "rounded-lg bg-[var(--color-brand-teal)] text-[var(--color-brand-ink)] font-black border-[2px] border-[var(--frame)]",
	weekend: "rounded-lg bg-[var(--surface-panel-soft)] text-muted-foreground border-[2px] border-[var(--frame)]/15",
};

export const brutCard =
	"bg-card border-[4px] border-[var(--frame)] rounded-[14px] shadow-[var(--shadow-brutal-md)] [contain:layout]";
