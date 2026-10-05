import { Strategy } from "../../../../web/src/domain/calendar/types";
import { LOCALES } from "../../../../web/src/infrastructure/i18n/locales";

export const APP_LOCALES = LOCALES;

const STRATEGY_DESCRIPTIONS: Record<Strategy, string> = {
	grouped:
		"A few long vacations. Ranks a Bridge by the length of the block it grows, towards about two weeks, and accepts a lower marginal return to get there. This is the default (initial value of the filters store).",
	optimized:
		"The most Effective Days for the budget. Ranks a Bridge by the days it adds to the plan per PTO Day, so a weekend two Bridges share is never paid for twice, and spreads equal picks across the year.",
	mainVacation:
		"The trip first. Builds one block of up to two weeks inside the Preferred Months the user picked, growing it with every Bridge that joins it at Grouped's lower floor, then spends what is left exactly like Optimized.",
	balanced:
		"Never too long at work. Ranks a Bridge by the longest stretch of work the plan would leave, then by how much it relieves the stretch it splits per PTO Day, so it places a long weekend every few weeks where the stretches without rest are longest, at the same marginal floor as Optimized.",
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
			{Object.values(Strategy).map((strategy) => (
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
