export interface VariantRow {
	axis: string;
	values: readonly string[];
	defaultValue?: string;
	notes?: string;
}

export const VariantsTable = ({ rows }: { rows: VariantRow[] }) => {
	return (
		<table className="min-[50rem]:table-fixed">
			<colgroup>
				<col className="min-[50rem]:w-[14%]" />
				<col className="min-[50rem]:w-[36%]" />
				<col className="min-[50rem]:w-[14%]" />
				<col className="min-[50rem]:w-[36%]" />
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
