import type { HolidayDTO } from "@application/dto/holiday/types";
import { useHolidaysStore } from "@application/stores/holidays/holidaysStore";
import { Button } from "@modules/components/core/button/Button";
import { Checkbox } from "@modules/components/core/checkbox/Checkbox";
import { DropdownMenu } from "@modules/components/core/dropdownMenu/DropdownMenu";
import { DropdownMenuContent } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuContent/DropdownMenuContent";
import { DropdownMenuItem } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuItem/DropdownMenuItem";
import { DropdownMenuTrigger } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuTrigger/DropdownMenuTrigger";
import { ConfirmModal } from "@modules/components/home/components/holidaySummary/atoms/confirmModal/ConfirmModal";
import { EditHolidayModal } from "@modules/components/home/components/holidaySummary/atoms/editHolidayModal/EditHolidayModal";
import { PremiumLock } from "@modules/components/premium/components/premiumLock/PremiumLock";
import type { ColumnDef } from "@tanstack/react-table";
import { getLocalizedDateFns } from "@ui/utils/i18n/getLocalizedDateFns/getLocalizedDateFns";
import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDown, Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";

export const getColumns = (locale: LocaleKey): ColumnDef<HolidayDTO>[] =>
	[
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
					/>
				</PremiumLock>
			),
		},
		{
			accessorKey: "date",
			header: ({ column }) => {
				return (
					<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
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
			header: "Nombre",
		},
		{
			id: "actions",
			header: "Acciones",
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
						<PremiumLock
							featureName="Acciones"
							description="Para poder editar o eliminar festivos, necesitas una suscripción premium."
							variant="small"
						>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" className="h-8 w-8 p-0">
										<span className="sr-only">Abrir menú</span>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
										<Edit2 className="mr-2 h-4 w-4" />
										Editar
									</DropdownMenuItem>
									<DropdownMenuItem
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground"
										onClick={() => setIsDeleteModalOpen(true)}
									>
										<Trash2 className="mr-2 h-4 w-4 text-white" />
										Eliminar
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
							title="Eliminar festivo"
							description="¿Estás seguro de que quieres eliminar este festivo? Esta acción no se puede deshacer."
							confirmText="Eliminar"
						/>
					</>
				);
			},
		},
	] as const;
