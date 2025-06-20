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
import { TableBody } from "@modules/components/core/table/atoms/tableBody/TableBody";
import { TableCell } from "@modules/components/core/table/atoms/tableCell/TableCell";
import { TableHeader } from "@modules/components/core/table/atoms/tableHeader/TableHeader";
import { TableRow } from "@modules/components/core/table/atoms/tableRow/TableRow";
import { TableHead } from "@modules/components/core/table/atoms/tablHead/TableHead";
import { Table } from "@modules/components/core/table/Table";
import { TabsContent } from "@modules/components/core/tabs/atoms/tabsContent/TabsContent";
import { AddHolidayModal } from "@modules/components/home/components/holidaySummary/atoms/addHolidayModal/AddHolidayModal";
import { ConfirmModal } from "@modules/components/home/components/holidaySummary/atoms/confirmModal/ConfirmModal";
import { getColumns } from "@modules/components/home/components/holidaySummary/atoms/holidaysTable/utils/getColumns";
import { HolidayTabVariant } from "@modules/components/home/components/holidaySummary/types";
import { PremiumLock } from "@modules/components/premium/components/premiumLock/PremiumLock";
import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
	const locale = useLocale();
	const t = useTranslations("holidaysTable");

	const table = useReactTable({
		data: holidays,
		columns: getColumns({ locale, translation: t }),
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
				<AccordionItem value={tabValue} className="border-b-0 ">
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
										{t("addHoliday")}
									</Button>
								)}
								<PremiumLock featureDescription={t("features.removeMultiple")} variant="small">
									<Button
										variant="destructive"
										size="sm"
										onClick={() => setIsDeleteModalOpen(true)}
										disabled={Object.keys(rowSelection).length === 0}
										className="gap-2"
									>
										<Trash2 className="h-4 w-4" />
										{t("actions.removeSelected")}
									</Button>
								</PremiumLock>
							</div>
							{holidays.length === 0 ? (
								<Alert>
									<AlertTriangle className="h-4 w-4" />
									<AlertTitle>No hay {title.toLowerCase()}</AlertTitle>
									<AlertDescription>{t("notFound", { holiday: title.toLowerCase() })}</AlertDescription>
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
												<TableCell colSpan={getColumns({ locale, translation: t }).length} className="h-24 text-center">
													{t("noResults")}
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
