"use client";

import type { HolidayDTO } from '@application/dto/holiday/types';
import { Accordion } from '@modules/components/core/accordion/Accordion';
import { AccordionContent } from '@modules/components/core/accordion/atoms/accordionContent/AccordionContent';
import { AccordionItem } from '@modules/components/core/accordion/atoms/accordionItem/AccordionItem';
import { AccordionTrigger } from '@modules/components/core/accordion/atoms/accordionTrigger/AccordionTrigger';
import { Alert } from '@modules/components/core/alert/Alert';
import { AlertDescription } from '@modules/components/core/alert/atoms/alertDescription/AlertDescription';
import { AlertTitle } from '@modules/components/core/alert/atoms/alertTitle/AlertTitle';
import { Button } from '@modules/components/core/button/Button';
import { Checkbox } from '@modules/components/core/checkbox/Checkbox';
import { Table } from '@modules/components/core/table/Table';
import { TableHead } from '@modules/components/core/table/atoms/tablHead/TableHead';
import { TableBody } from '@modules/components/core/table/atoms/tableBody/TableBody';
import { TableCell } from '@modules/components/core/table/atoms/tableCell/TableCell';
import { TableHeader } from '@modules/components/core/table/atoms/tableHeader/TableHeader';
import { TableRow } from '@modules/components/core/table/atoms/tableRow/TableRow';
import { TabsContent } from '@modules/components/core/tabs/atoms/tabsContent/TabsContent';
import { formatFullDate } from '@modules/components/home/components/holidaySummary/utils/formatFullDate/formatFullDate';
import { getWeekday } from '@modules/components/home/components/holidaySummary/utils/getWeekDay/getWeekDay';
import { PremiumLock } from '@modules/components/premium/components/premiumLock/PremiumLock';
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDown, Lock } from 'lucide-react';
import { useState } from 'react';

interface CustomHolidaysProps {
	customHolidays: HolidayDTO[];
}

const columns: ColumnDef<HolidayDTO>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<PremiumLock
				featureName="Selección múltiple"
				description="Para poder seleccionar múltiples festivos, necesitas una suscripción premium."
				variant="small"
			>
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Seleccionar todo"
					disabled
				/>
			</PremiumLock>
		),
		cell: ({ row }) => (
			<PremiumLock
				featureName="Selección múltiple"
				description="Para poder seleccionar múltiples festivos, necesitas una suscripción premium."
				variant="small"
			>
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Seleccionar fila"
					disabled
				/>
			</PremiumLock>
		),
		enableSorting: false,
	},
	{
		id: "date",
		accessorKey: "date",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="p-0 hover:bg-transparent"
				>
					Fecha
					{column.getIsSorted() === "asc" ? (
						<ArrowUpIcon className="ml-2 h-4 w-4" />
					) : column.getIsSorted() === "desc" ? (
						<ArrowDownIcon className="ml-2 h-4 w-4" />
					) : (
						<ChevronsUpDown className="ml-2 h-4 w-4" />
					)}
				</Button>
			);
		},
		cell: ({ row }) => formatFullDate(row.getValue("date")),
	},
	{
		id: "weekday",
		accessorKey: "date",
		header: "Día",
		cell: ({ row }) => getWeekday(row.getValue("date")),
		enableSorting: false,
	},
	{
		accessorKey: "name",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="p-0 hover:bg-transparent"
				>
					Nombre
					{column.getIsSorted() === "asc" ? (
						<ArrowUpIcon className="ml-2 h-4 w-4" />
					) : column.getIsSorted() === "desc" ? (
						<ArrowDownIcon className="ml-2 h-4 w-4" />
					) : (
						<ChevronsUpDown className="ml-2 h-4 w-4" />
					)}
				</Button>
			);
		},
	},
];

export const CustomHolidays = ({ customHolidays }: CustomHolidaysProps) => {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [rowSelection, setRowSelection] = useState({});

	const table = useReactTable({
		data: customHolidays,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			rowSelection,
		},
		initialState: {
			pagination: {
				pageSize: 20,
			},
		},
	});

	return (
		<TabsContent value="custom-holidays">
			<Accordion type="single" collapsible className="rounded-md border shadow-xs" disabled>
				<AccordionItem value="custom-holidays">
					<PremiumLock variant="stacked">
						<AccordionTrigger className="px-4">
							<div className="flex items-center gap-2">
								Festivos Personalizados
								<Lock className="h-4 w-4" />
							</div>
						</AccordionTrigger>
					</PremiumLock>

					<AccordionContent>
						<div className="p-4">
							<Alert className="mb-3">
								<div className="flex items-center">
									<Lock className="h-4 w-4 mr-2" />
									<AlertTitle>Próximamente</AlertTitle>
								</div>
								<AlertDescription>Podrás añadir tus propios festivos personalizados próximamente.</AlertDescription>
							</Alert>

							<div className="rounded-md border">
								<Table>
									<TableHeader>
										{table.getHeaderGroups().map((headerGroup) => (
											<TableRow key={headerGroup.id}>
												{headerGroup.headers.map((header) => (
													<TableHead key={header.id}>
														{header.isPlaceholder
															? null
															: flexRender(header.column.columnDef.header, header.getContext())}
													</TableHead>
												))}
											</TableRow>
										))}
									</TableHeader>
									<TableBody>
										{table.getRowModel().rows?.length ? (
											table.getRowModel().rows.map((row) => (
												<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
													{row.getVisibleCells().map((cell) => (
														<TableCell key={cell.id}>
															{flexRender(cell.column.columnDef.cell, cell.getContext())}
														</TableCell>
													))}
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell colSpan={columns.length} className="h-24 text-center">
													No hay festivos personalizados configurados
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>

							<div className="flex items-center justify-between space-x-2 py-4">
								<div className="text-sm text-muted-foreground">
									{table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s)
									seleccionada(s).
								</div>
								<div className="flex items-center space-x-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => table.previousPage()}
										disabled={!table.getCanPreviousPage()}
									>
										Anterior
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => table.nextPage()}
										disabled={!table.getCanNextPage()}
									>
										Siguiente
									</Button>
								</div>
							</div>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</TabsContent>
	);
};
