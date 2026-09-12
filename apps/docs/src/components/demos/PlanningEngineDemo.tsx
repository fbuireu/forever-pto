import { PTO_CONSTANTS } from "../../../../web/src/domain/calendar/const";

// `const.ts` is dependency-free (no imports at all), so it is safe to import by relative path even
// though it lives outside `src/ui/`. Interpolating the real values keeps the tunables the wiki
// quotes equal to the ones the engine runs on.
export { PTO_CONSTANTS };

type Leaves<T, PREFIX extends string = ""> = {
	[KEY in keyof T & string]: T[KEY] extends number ? `${PREFIX}${KEY}` : Leaves<T[KEY], `${PREFIX}${KEY}.`>;
}[keyof T & string];

type TunableKey = Leaves<typeof PTO_CONSTANTS>;

// Exhaustive over every leaf of PTO_CONSTANTS: adding, renaming or removing a tunable in
// `apps/web/src/domain/calendar/const.ts` makes `astro check` fail here, so this table cannot drift.
const TUNABLE_DESCRIPTIONS: Record<TunableKey, string> = {
	SAFETY_LIMIT:
		"Upper bound on how many days a Bridge may expand into adjacent Free Days in either direction. A guard against a runaway loop, not a planning rule; one year of days is unreachable in practice.",
	"BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD":
		"Two Bridges whose Efficiency differs by less than this are treated as equal and ordered by Effective Days instead, so a longer stretch wins a near tie.",
	"SCORING.BASE_SCORE": "The multiplier a Bridge gets when it is not block-shaped: no bonus.",
	"SCORING.MULTI_DAY_BONUS":
		"The multiplier a block-shaped Bridge gets in the Balanced score, so a long block beats a short one of equal Efficiency.",
	"SCORING.EFFICIENCY": "Weight of Efficiency in the Balanced composite score.",
	"SCORING.TOTAL_VALUE": "Weight of the normalised Effective Days in the Balanced composite score.",
	"SCORING.VALUE_DIVISOR":
		"Effective Days are divided by this before weighting, so a ten-day stretch scores 1.0 on that axis and is comparable with an Efficiency ratio.",
	"SELECTION_WEIGHTS.HIGH_VALUE_THRESHOLD_DAYS":
		"Minimum PTO Days a Bridge must spend to count as block-shaped, and therefore eligible for the multi-day bonus and the high-value tier.",
	"SELECTION_WEIGHTS.HIGH_VALUE_THRESHOLD_EFFECTIVE":
		"Minimum Effective Days a Bridge must produce to count as block-shaped.",
	"EFFICIENCY.ACCEPTABLE":
		"A block-shaped Bridge also needs at least this Efficiency to be promoted to the front of the Balanced ordering.",
	"EFFICIENCY.MINIMUM":
		"A candidate below this Efficiency is discarded during generation and never reaches any Strategy. Two is the natural floor: one PTO Day beside a weekend already returns two Effective Days per day spent... only a candidate that does at least as well is worth offering.",
	"BRIDGE_SEARCH.MIN_MULTI_DAY_SIZE": "Smallest multi-day Bridge the search tries, in consecutive Workdays.",
	"BRIDGE_SEARCH.MAX_MULTI_DAY_SIZE":
		"Largest multi-day Bridge the search tries. Longer stretches are built by the selector combining adjacent Bridges, not by generating one huge candidate.",
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

const GROUP_OF = (key: TunableKey) => (key.includes(".") ? key.split(".")[0] : "ROOT");

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
							<code>{GROUP_OF(key)}</code>
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

export const BalancedScoreFormula = () => {
	const { EFFICIENCY, TOTAL_VALUE, VALUE_DIVISOR, MULTI_DAY_BONUS, BASE_SCORE } = PTO_CONSTANTS.SCORING;

	return (
		<pre>
			<code>
				{`score = (efficiency × ${EFFICIENCY} + (effectiveDays ÷ ${VALUE_DIVISOR}) × ${TOTAL_VALUE}) × bonus\n`}
				{`bonus = ${MULTI_DAY_BONUS} when block-shaped, ${BASE_SCORE} otherwise`}
			</code>
		</pre>
	);
};
