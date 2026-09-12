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
		<table style={{ tableLayout: "fixed" }}>
			<colgroup>
				<col style={{ width: "14%" }} />
				<col style={{ width: "36%" }} />
				<col style={{ width: "14%" }} />
				<col style={{ width: "36%" }} />
			</colgroup>
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
							<span style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
								{values.map((value) => (
									<code key={value}>{value}</code>
								))}
							</span>
						</td>
						<td>{defaultValue ? <code>{defaultValue}</code> : "—"}</td>
						<td>{notes ?? ""}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};
