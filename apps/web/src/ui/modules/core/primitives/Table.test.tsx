import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table";

const renderTable = () =>
	render(
		<Table containerClassName="mt-4" className="text-xs">
			<TableHeader className="sticky">
				<TableRow className="border-0">
					<TableHead className="w-1/2">Holiday</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody className="divide-y">
				<TableRow>
					<TableCell className="font-bold">Christmas</TableCell>
				</TableRow>
			</TableBody>
		</Table>,
	);

describe("Table", () => {
	it("wraps the table in a scrolling frame, with the container class on the frame and the class on the table", () => {
		const { container } = renderTable();

		const frame = container.querySelector('[data-slot="table-container"]') as HTMLElement;
		expect(frame.className).toContain("overflow-x-auto");
		expect(frame.className).toContain("mt-4");
		expect(frame.contains(screen.getByRole("table"))).toBe(true);
		expect(screen.getByRole("table").className).toContain("text-xs");
		expect(screen.getByRole("table").className).not.toContain("mt-4");
	});

	it("keeps the table's native semantics, so a reader can navigate it by cell", () => {
		renderTable();

		expect(screen.getByRole("columnheader", { name: "Holiday" })).toBeDefined();
		expect(screen.getByRole("cell", { name: "Christmas" })).toBeDefined();
		expect(screen.getAllByRole("row")).toHaveLength(2);
		expect(screen.getAllByRole("rowgroup")).toHaveLength(2);
	});

	it("marks every part with its slot and merges the caller's class on each", () => {
		renderTable();

		const [header, body] = screen.getAllByRole("rowgroup");
		expect(header.dataset.slot).toBe("table-header");
		expect(header.className).toContain("sticky");
		expect(body.dataset.slot).toBe("table-body");
		expect(body.className).toContain("divide-y");

		const [headRow] = screen.getAllByRole("row");
		expect(headRow.dataset.slot).toBe("table-row");
		expect(headRow.className).toContain("border-0");

		const head = screen.getByRole("columnheader", { name: "Holiday" });
		expect(head.dataset.slot).toBe("table-head");
		expect(head.className).toContain("w-1/2");

		const cell = screen.getByRole("cell", { name: "Christmas" });
		expect(cell.dataset.slot).toBe("table-cell");
		expect(cell.className).toContain("font-bold");
	});
});
