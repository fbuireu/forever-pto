export interface PropRow {
	prop: string;
	type: string;
	defaultValue?: string;
	description: string;
}

type RowBody = Omit<PropRow, "prop">;

export type OwnProps<PROPS, BASE> = Exclude<keyof PROPS, keyof BASE>;

export const propRows = <NAME extends string>(rows: Record<NAME, RowBody>): PropRow[] =>
	(Object.entries(rows) as [NAME, RowBody][]).map(([prop, body]) => ({ prop, ...body }));

interface PropsTableProps {
	rows: PropRow[];
	extends?: string;
}

export const PropsTable = ({ rows, extends: base }: PropsTableProps) => (
	<>
		<table style={{ tableLayout: "fixed" }}>
			<colgroup>
				<col style={{ width: "17%" }} />
				<col style={{ width: "21%" }} />
				<col style={{ width: "19%" }} />
				<col style={{ width: "43%" }} />
			</colgroup>
			<thead>
				<tr>
					<th>Prop</th>
					<th>Type</th>
					<th>Default</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				{rows.map(({ prop, type, defaultValue, description }) => (
					<tr key={prop}>
						<td>
							<code>{prop}</code>
						</td>
						<td>
							<code>{type}</code>
						</td>
						<td>{defaultValue ? <code>{defaultValue}</code> : "none"}</td>
						<td>{description}</td>
					</tr>
				))}
			</tbody>
		</table>
		{base ? (
			<p>
				Every other prop is forwarded to <code>{base}</code>.
			</p>
		) : null}
	</>
);
