export interface VariantRow {
  axis: string;
  values: readonly string[];
  defaultValue?: string;
  notes?: string;
}

/**
 * Renders a component's variant axes. Demo wrappers build the rows from
 * `Record<Variant, …>` maps typed against the real CVA exports
 * (`VariantProps<typeof buttonVariants>`), so a renamed, added or removed
 * variant in the app breaks `astro check` instead of silently letting this
 * documentation drift.
 */
export const VariantsTable = ({ rows }: { rows: VariantRow[] }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Axis</th>
          <th>Values</th>
          <th>Default</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ axis, values, defaultValue, notes }) => (
          <tr key={axis}>
            <td>
              <code>{axis}</code>
            </td>
            <td>
              {values.map((value) => (
                <code key={value} style={{ marginRight: '0.5rem', whiteSpace: 'nowrap' }}>
                  {value}
                </code>
              ))}
            </td>
            <td>{defaultValue ? <code>{defaultValue}</code> : '—'}</td>
            <td>{notes ?? ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
