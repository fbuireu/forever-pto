import { FilterStrategy } from '../../../../src/domain/calendar/types';
import { LOCALES } from '../../../../src/infrastructure/i18n/locales';

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
    'Prefers the longest consecutive blocks first: fewer, longer breaks. This is the default (initial value of the filters store).',
  optimized:
    'Prefers the highest-efficiency bridges first — the best effectiveDays / ptoDaysNeeded ratio — and requires a higher minimum efficiency than the other strategies.',
  balanced:
    'Two-pass greedy selection over a composite score: (efficiency x 0.6 + normalised span x 0.4) x multi-day bonus. Trades raw efficiency for spread across the year.',
};

export const StrategiesTable = () => (
  <table>
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
