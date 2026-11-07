import { Badge } from "@ui/modules/core/primitives/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ui/modules/core/primitives/Table";
import type { ComponentProps } from "react";
import { Demo } from "../Demo";
import { type OwnProps, propRows } from "../PropsTable";

const HOLIDAYS = [
	{ id: "new-year", name: "New Year's Day", date: "2026-01-01", day: "Thursday", type: "national", weekend: false },
	{ id: "st-george", name: "Sant Jordi", date: "2026-04-23", day: "Thursday", type: "regional", weekend: false },
	{
		id: "assumption",
		name: "Assumption of Mary",
		date: "2026-08-15",
		day: "Saturday",
		type: "national",
		weekend: true,
	},
	{ id: "christmas", name: "Christmas Day", date: "2026-12-25", day: "Friday", type: "national", weekend: false },
];

export const TableDemo = () => (
	<Demo>
		<Table tabIndex={0} aria-label="Holidays">
			<TableHeader>
				<TableRow>
					<TableHead>Holiday</TableHead>
					<TableHead>Date</TableHead>
					<TableHead>Day</TableHead>
					<TableHead>Type</TableHead>
					<TableHead>Status</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{HOLIDAYS.map(({ id, name, date, day, type, weekend }) => (
					<TableRow key={id}>
						<TableCell className="font-medium">{name}</TableCell>
						<TableCell className="font-mono text-sm">{date}</TableCell>
						<TableCell className="text-sm text-muted-foreground">{day}</TableCell>
						<TableCell>
							<Badge variant="outline" className="capitalize text-xs">
								{type}
							</Badge>
						</TableCell>
						<TableCell>
							<Badge variant={weekend ? "destructive" : "default"} className="text-xs">
								{weekend ? "Weekend" : "Weekday holiday"}
							</Badge>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	</Demo>
);

export const TABLE_PROP_ROWS = propRows<OwnProps<ComponentProps<typeof Table>, ComponentProps<"table">>>({
	containerClassName: {
		type: "string",
		description:
			"Classes for the scroll container that owns the frame, the shadow and overflow-x: auto; className goes to the table element itself.",
	},
});
