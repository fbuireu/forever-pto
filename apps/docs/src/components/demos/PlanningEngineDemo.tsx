import { PTO_CONSTANTS } from "../../../../web/src/domain/calendar/const";

export { PTO_CONSTANTS };

type Leaves<T, PREFIX extends string = ""> = {
	[KEY in keyof T & string]: T[KEY] extends number ? `${PREFIX}${KEY}` : Leaves<T[KEY], `${PREFIX}${KEY}.`>;
}[keyof T & string];

type TunableKey = Leaves<typeof PTO_CONSTANTS>;

const TUNABLE_DESCRIPTIONS: Record<TunableKey, string> = {
	SAFETY_LIMIT:
		"Upper bound on how many days a Bridge may expand into adjacent Free Days in either direction. A guard against a runaway loop, not a planning rule; one year of days is unreachable in practice.",
	"BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD":
		"Two Bridges whose Efficiency differs by less than this are treated as equal and ordered by Effective Days instead, so a longer stretch wins a near tie.",
	"EFFICIENCY.MINIMUM":
		"The marginal floor of Optimized and Balanced: a Bridge is taken only while the days it adds to the plan, divided by the PTO Days it costs, reach this. One PTO Day beside a weekend returns three, a Thursday and Friday before one return exactly two.",
	"EFFICIENCY.BLOCK_MINIMUM":
		"The marginal floor of Grouped, and the admission floor of the search. A working week between two weekends returns nine days for five and a week that extends a block already taken returns seven for five, which is the lowest this floor lets through. No Strategy can take a candidate under it, so the search does not keep one.",
	"BRIDGE_SEARCH.MIN_MULTI_DAY_SIZE": "Smallest multi-day Bridge the search tries, in consecutive Workdays.",
	"BRIDGE_SEARCH.MAX_MULTI_DAY_SIZE":
		"Largest multi-day Bridge the search tries: a whole working week. Anything longer is two Bridges the selector joins, and the marginal gain is what makes joining them worth it.",
	"SELECTION.GROUPED_MAX_BLOCK_DAYS":
		"The stretch Grouped grows a block towards. Up to it every day counts for the Bridge; past it each further day counts against, so the next week of budget usually opens a second block. A target, not a wall.",
	"SELECTION.BALANCED_MAX_BLOCK_DAYS":
		"A tie-break for Balanced: among picks that leave the same stretch of work and bring the same relief, the one whose stretch off ends up closer to a week and both weekends wins.",
	"SELECTION.MAIN_VACATION_BLOCK_DAYS":
		"The longest block Main Vacation builds inside the Preferred Months before it spends the rest like Optimized. Unlike Grouped's cap it is a hard limit: a Bridge that would push the block past it is not admitted to that stage at all.",
	"SELECTION.RANK_TOLERANCE":
		"Two rank values closer than this are a tie, and the next key decides. The marginal gain is a division, so an exact comparison would order equal candidates on rounding noise.",
	"ALTERNATIVES.MIN_DIFFERENCE":
		"How far apart two plans must be to both be offered, as the share of their combined days they do not have in common. An Alternative closer than this to the Suggestion or to an earlier Alternative is dropped.",
	"ALTERNATIVES.SEARCHED":
		"How many Alternatives the search looks for, whatever the planner shows. The same search is what finds a better Suggestion, so sizing it by the number displayed would let that number change the plan.",
	"ALTERNATIVES.RUNS_PER_ALTERNATIVE":
		"How many selection runs the search may spend per Alternative it looks for. It bounds the cost of the search, not its result: a search that finds enough distinct plans stops sooner.",
	"METRICS.LONG_BLOCK_MINIMUM_DAYS": "A Rest Block of at least this many days counts as a Long Block.",
	"METRICS.LONG_WEEKEND_MINIMUM_DAYS":
		"A free streak of at least this many days that contains a weekend and a placed PTO Day counts as a Long Weekend.",
	"METRICS.REST_BLOCK_SEPARATION_DAYS":
		"Two placed PTO Days further apart than this start a new Rest Block; closer together, they belong to the same one.",
	"METRICS.STREAK_SCAN_MARGIN_DAYS":
		"How far before the first and after the last relevant date the free-streak scan extends, so a stretch that begins or ends outside the placed days is still measured whole.",
};

const readTunable = (key: TunableKey): number =>
	key
		.split(".")
		.reduce<unknown>((value, segment) => (value as Record<string, unknown>)[segment], PTO_CONSTANTS) as number;

const groupOf = (key: TunableKey) => (key.includes(".") ? key.split(".")[0] : "ROOT");

export const TunablesTable = () => {
	const keys = Object.keys(TUNABLE_DESCRIPTIONS) as TunableKey[];

	return (
		<table style={{ tableLayout: "fixed" }}>
			<colgroup>
				<col style={{ width: "18%" }} />
				<col style={{ width: "26%" }} />
				<col style={{ width: "10%" }} />
				<col style={{ width: "46%" }} />
			</colgroup>
			<thead>
				<tr>
					<th>Group</th>
					<th>Tunable</th>
					<th>Value</th>
					<th>What it controls</th>
				</tr>
			</thead>
			<tbody>
				{keys.map((key) => (
					<tr key={key}>
						<td>
							<code>{groupOf(key)}</code>
						</td>
						<td>
							<code>{key.includes(".") ? key.split(".").slice(1).join(".") : key}</code>
						</td>
						<td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
							{readTunable(key)}
						</td>
						<td>{TUNABLE_DESCRIPTIONS[key]}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};

export const StrategyRanking = () => {
	const { MINIMUM, BLOCK_MINIMUM } = PTO_CONSTANTS.EFFICIENCY;
	const { GROUPED_MAX_BLOCK_DAYS, BALANCED_MAX_BLOCK_DAYS, MAIN_VACATION_BLOCK_DAYS } = PTO_CONSTANTS.SELECTION;

	return (
		<pre>
			<code>
				{"marginal     = days the Bridge adds to the plan ÷ its PTO Days\n"}
				{
					"stretch      = length of the stretch off it ends up in, counted up to the cap and back down by one for every day past it\n\n"
				}
				{`optimized    : marginal ≥ ${MINIMUM}, ranked by marginal, then stretch, then distance from the other stretches off\n`}
				{`grouped      : marginal ≥ ${BLOCK_MINIMUM}, ranked by stretch (cap ${GROUPED_MAX_BLOCK_DAYS}), then marginal, then distance\n`}
				{`balanced     : marginal ≥ ${MINIMUM}, ranked by the longest stretch of work left, then relief per PTO Day, then stretch (cap ${BALANCED_MAX_BLOCK_DAYS}), then marginal, then distance\n`}
				{`mainVacation : first one block in the Preferred Months, marginal ≥ ${BLOCK_MINIMUM}, ranked by stretch (≤ ${MAIN_VACATION_BLOCK_DAYS}), then marginal, then distance; then as optimized`}
			</code>
		</pre>
	);
};
