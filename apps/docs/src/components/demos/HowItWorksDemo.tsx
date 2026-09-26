import { FilterStrategy } from "../../../../web/src/domain/calendar/types";
import { LOCALES } from "../../../../web/src/infrastructure/i18n/locales";

// These two app modules are dependency-free (no Next.js imports, no path
// aliases), so they are safe to import here via relative path even though they
// live outside `src/ui/`. Re-exporting them lets the MDX pages interpolate the
// real constants instead of hard-coding values that could drift.
export const APP_LOCALES = LOCALES;
export { FilterStrategy };

// Exhaustive Record over the real FilterStrategy const object: adding,
// renaming or removing a strategy in `src/domain/calendar/types.ts` makes
// `astro check` fail here, keeping the docs honest.
const STRATEGY_DESCRIPTIONS: Record<FilterStrategy, string> = {
	grouped:
		"A few long vacations. Ranks a Bridge by the length of the block it grows, up to about two weeks, and accepts a lower marginal return to get there. This is the default (initial value of the filters store).",
	optimized:
		"The most Effective Days for the budget. Ranks a Bridge by the days it adds to the plan per PTO Day, so a weekend two Bridges share is never paid for twice, and spreads equal picks across the year.",
	mainVacation:
		"The trip first. Builds one block of up to two weeks inside the Preferred Months the user picked, growing it a week at a time at Grouped's lower floor, then spends what is left exactly like Optimized.",
	balanced:
		"Breaks across the whole year. Gives every quarter its share of the budget first, and within it prefers breaks of up to a week, at the same marginal floor as Optimized.",
};

export const StrategiesTable = () => (
	<table style={{ tableLayout: "fixed" }}>
		<colgroup>
			<col style={{ width: "16%" }} />
			<col style={{ width: "84%" }} />
		</colgroup>
		<thead>
			<tr>
				<th>Value</th>
				<th>Behavior</th>
			</tr>
		</thead>
		<tbody>
			{Object.values(FilterStrategy).map((strategy) => (
				<tr key={strategy}>
					<td>
						<code>{strategy}</code>
					</td>
					<td>{STRATEGY_DESCRIPTIONS[strategy]}</td>
				</tr>
			))}
		</tbody>
	</table>
);
