"use client";

import type { HolidayDTO } from "@application/dto/holiday/types";
import { useHolidaysStore } from "@application/stores/holidays/holidaysStore";
import { usePremiumStore } from "@application/stores/premium/premiumStore";
import { Accordion } from "@modules/components/core/accordion/Accordion";
import { AccordionContent } from "@modules/components/core/accordion/atoms/accordionContent/AccordionContent";
import { AccordionItem } from "@modules/components/core/accordion/atoms/accordionItem/AccordionItem";
import { AccordionTrigger } from "@modules/components/core/accordion/atoms/accordionTrigger/AccordionTrigger";
import { Alert } from "@modules/components/core/alert/Alert";
import { AlertDescription } from "@modules/components/core/alert/atoms/alertDescription/AlertDescription";
import { AlertTitle } from "@modules/components/core/alert/atoms/alertTitle/AlertTitle";
import { Button } from "@modules/components/core/button/Button";
import { Table } from "@modules/components/core/table/Table";
import { TableHead } from "@modules/components/core/table/atoms/tablHead/TableHead";
import { TableBody } from "@modules/components/core/table/atoms/tableBody/TableBody";
import { TableCell } from "@modules/components/core/table/atoms/tableCell/TableCell";
import { TableHeader } from "@modules/components/core/table/atoms/tableHeader/TableHeader";
import { TableRow } from "@modules/components/core/table/atoms/tableRow/TableRow";
import { TabsContent } from "@modules/components/core/tabs/atoms/tabsContent/TabsContent";
import { AddHolidayModal } from "@modules/components/home/components/holidaySummary/atoms/addHolidayModal/AddHolidayModal";
import { ConfirmModal } from "@modules/components/home/components/holidaySummary/atoms/confirmModal/ConfirmModal";
import { COLUMNS } from "@modules/components/home/components/holidaySummary/atoms/holidaysTable/config";
import { HolidayTabVariant } from "@modules/components/home/components/holidaySummary/types";
import { PremiumLock } from "@modules/components/premium/components/premiumLock/PremiumLock";
import {
	type SortingState,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { mergeClasses } from "@ui/utils/mergeClasses";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface HolidaysTableProps {
	holidays: HolidayDTO[];
	title: string;
	tabValue: (typeof HolidayTabVariant)[keyof typeof HolidayTabVariant];
}

export const HolidaysTable = ({ holidays, title, tabValue }: HolidaysTableProps) => {
	const { isPremiumUser } = usePremiumStore();
	const { removeHoliday, addHoliday } = useHolidaysStore();
	const [sorting, setSorting] = useState<SortingState>([]);
	const [rowSelection, setRowSelection] = useState({});
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);

	const table = useReactTable({
		data: holidays,
		columns: COLUMNS,
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

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		for (const row of selectedRows) {
			const date = row.original.date.toISOString();
			removeHoliday(date);
		}
		setRowSelection({});
		setIsDeleteModalOpen(false);
	};

	return (
		<TabsContent value={tabValue}>
			<Accordion
				type="single"
				collapsible
				className="rounded-md border shadow-xs"
				disabled={!holidays.length && tabValue !== HolidayTabVariant.customHolidays}
			>
				<AccordionItem value={tabValue}>
					<AccordionTrigger className="px-4">{title}</AccordionTrigger>
					<AccordionContent>
						<div className="p-4">
							<div
								className={mergeClasses(
									"flex justify-end gap-2 mb-4 [&>div>button]:mt-2",
									!isPremiumUser && "w-95/100",
								)}
							>
								{tabValue === HolidayTabVariant.customHolidays && (
									<Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-2">
										<Plus className="h-4 w-4" />
										Añadir festivo
									</Button>
								)}
								<PremiumLock
									featureName="Eliminación múltiple"
									description="Para poder eliminar múltiples festivos, necesitas una suscripción premium."
									variant="small"
								>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => setIsDeleteModalOpen(true)}
										disabled={Object.keys(rowSelection).length === 0}
										className="gap-2"
									>
										<Trash2 className="h-4 w-4" />
										Eliminar seleccionados
									</Button>
								</PremiumLock>
							</div>
							{holidays.length === 0 ? (
								<Alert>
									<AlertTriangle className="h-4 w-4" />
									<AlertTitle>No hay {title.toLowerCase()}</AlertTitle>
									<AlertDescription>
										No se han encontrado {title.toLowerCase()} para el año seleccionado.
									</AlertDescription>
								</Alert>
							) : (
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
												<TableCell colSpan={COLUMNS.length} className="h-24 text-center">
													No hay resultados.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							)}
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
			<ConfirmModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={handleBulkDelete}
				title="Eliminar festivos"
				description="¿Estás seguro de que quieres eliminar los festivos seleccionados?"
			/>
			<AddHolidayModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSave={(date, name) => {
					addHoliday({
						date,
						name,
						variant: "custom",
					});
				}}
			/>
		</TabsContent>
	);
};
