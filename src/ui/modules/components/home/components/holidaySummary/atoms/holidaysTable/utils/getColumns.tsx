import type { HolidayDTO } from "@application/dto/holiday/types";
import { useHolidaysStore } from "@application/stores/holidays/holidaysStore";
import { Button } from "@modules/components/core/button/Button";
import { Checkbox } from "@modules/components/core/checkbox/Checkbox";
import { DropdownMenuContent } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuContent/DropdownMenuContent";
import { DropdownMenuItem } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuItem/DropdownMenuItem";
import { DropdownMenuTrigger } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuTrigger/DropdownMenuTrigger";
import { DropdownMenu } from "@modules/components/core/dropdownMenu/DropdownMenu";
import { ConfirmModal } from "@modules/components/home/components/holidaySummary/atoms/confirmModal/ConfirmModal";
import { EditHolidayModal } from "@modules/components/home/components/holidaySummary/atoms/editHolidayModal/EditHolidayModal";
import { PremiumLock } from "@modules/components/premium/components/premiumLock/PremiumLock";
import type { ColumnDef } from "@tanstack/react-table";
import { getLocalizedDateFns, type LocaleKey } from "@ui/utils/i18n/getLocalizedDateFns/getLocalizedDateFns";
import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDown, Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import type { useTranslations } from "next-intl";
import { useState } from "react";

interface GetColumnsParams {
	locale: LocaleKey;
	t: ReturnType<typeof useTranslations<"holidaysTable">>;
}

export const getColumns = ({ locale, t }: GetColumnsParams): ColumnDef<HolidayDTO>[] =>
	[
		{
			id: "select",
			header: ({ table }) => (
				<PremiumLock featureDescription={t("features.selectHolidays")} variant="small">
					<Checkbox
						checked={table.getIsAllPageRowsSelected()}
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
						aria-label={t("actions.selectAll")}
					/>
				</PremiumLock>
			),
			cell: ({ row }) => (
				<PremiumLock featureDescription={t("features.selectHolidays")} variant="small">
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label={t("actions.selectRow")}
					/>
				</PremiumLock>
			),
		},
		{
			accessorKey: "date",
			header: ({ column }) => {
				return (
					<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
						{t("headers.date")}
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
			cell: ({ row }) => {
				const date = row.getValue("date") as Date;
				return (
					<p className="flex flex-col">
						<span>{format(date, "dd MMMM yyyy", { locale: getLocalizedDateFns(locale) })}</span>
						<span className="text-sm text-muted-foreground">
							{format(date, "EEEE", { locale: getLocalizedDateFns(locale) })}
						</span>
					</p>
				);
			},
		},
		{
			accessorKey: "name",
			header: t("headers.name"),
		},
		{
			id: "actions",
			header: t("headers.actions"),
			cell: ({ row }) => {
				const holiday = row.original;
				const { removeHoliday, updateHoliday } = useHolidaysStore();
				const [isEditModalOpen, setIsEditModalOpen] = useState(false);
				const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

				const handleEdit = (newDate: Date, newName: string) => {
					updateHoliday(holiday.date.toISOString(), {
						...holiday,
						date: newDate,
						name: newName,
					});
				};

				return (
					<>
						<PremiumLock featureDescription={t("features.editRemove")} variant="small">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" className="h-8 w-8 p-0">
										<span className="sr-only">{t("actions.openMenu")}</span>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
										<Edit2 className="mr-2 h-4 w-4" />
										{t("actions.edit")}
									</DropdownMenuItem>
									<DropdownMenuItem
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground"
										onClick={() => setIsDeleteModalOpen(true)}
									>
										<Trash2 className="mr-2 h-4 w-4 text-white" />
										{t("actions.remove")}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</PremiumLock>
						<EditHolidayModal
							isOpen={isEditModalOpen}
							onClose={() => setIsEditModalOpen(false)}
							onSave={handleEdit}
							initialDate={holiday.date}
							initialName={holiday.name}
						/>
						<ConfirmModal
							isOpen={isDeleteModalOpen}
							onClose={() => setIsDeleteModalOpen(false)}
							onConfirm={() => {
								removeHoliday(holiday.date.toISOString());
								setIsDeleteModalOpen(false);
							}}
						/>
					</>
				);
			},
		},
	] as const;
