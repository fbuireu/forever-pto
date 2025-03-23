import type { HolidayDTO } from '@application/dto/holiday/types';
import { formatFullDate } from '@modules/components/home/components/holidaySummary/utils/formatFullDate/formatFullDate';
import { getWeekday } from '@modules/components/home/components/holidaySummary/utils/getWeekDay/getWeekDay';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@ui/modules/components/core/accordion/Accordion';
import { Alert, AlertDescription, AlertTitle } from '@ui/modules/components/core/alert/Alert';
import { Badge } from '@ui/modules/components/core/badge/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/modules/components/core/table/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/modules/components/core/tabs/Tabs';
import { AlertTriangle, CalendarIcon } from 'lucide-react';
import type React from 'react';

interface HolidaysSummaryProps {
	holidays: HolidayDTO[];
}

const HolidaysSummary = ({ holidays }: HolidaysSummaryProps) => {
	const nationalHolidays = holidays.filter((holiday) => !holiday.location);
	const regionalHolidays = holidays.filter((holiday) => !!holiday.location);

	return (
		<div className="mb-6">
			<Tabs defaultValue="national-holidays" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="national-holidays" disabled={!nationalHolidays.length}>
						Festivos Nacionales
					</TabsTrigger>
					<TabsTrigger value="regional-holidays" disabled={!regionalHolidays.length}>
						Festivos Regionales
					</TabsTrigger>
				</TabsList>
				<TabsContent value="national-holidays">
					<Accordion
						type="single"
						collapsible
						className="rounded-md border shadow-xs"
						disabled={!nationalHolidays.length}
					>
						<AccordionItem value="national-holidays" className="border-none">
							<AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
								<div className="flex items-center">
									<CalendarIcon className="mr-2 h-5 w-5 text-primary" />
									<span>Días Festivos Nacionales</span>
									<Badge variant="outline" className="ml-2 bg-primary/10">
										{nationalHolidays.length}
									</Badge>
								</div>
							</AccordionTrigger>
							<AccordionContent className="px-4 pb-4">
								<Alert className="mb-3">
									<div className="flex items-center">
										<AlertTriangle className="h-4 w-4 mr-2" />
										<AlertTitle>Atención</AlertTitle>
									</div>
									<AlertDescription>
										Los festivos mostrados pueden ser incorrectos. Podrás modificarlos próximamente para ajustarlos a
										tus necesidades.
									</AlertDescription>
								</Alert>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Fecha</TableHead>
											<TableHead>Día</TableHead>
											<TableHead>Nombre</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{nationalHolidays.length > 0 ? (
											nationalHolidays.map((holiday) => (
												<TableRow key={`${holiday.name}-${holiday.date}`}>
													<TableCell className="whitespace-nowrap">{formatFullDate(holiday.date)}</TableCell>
													<TableCell className="whitespace-nowrap">{getWeekday(holiday.date)}</TableCell>
													<TableCell>{holiday.name}</TableCell>
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell colSpan={3} className="text-center text-muted-foreground">
													No hay festivos nacionales configurados
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</TabsContent>
				<TabsContent value="regional-holidays">
					<Accordion type="single" collapsible className="rounded-md border shadow-xs">
						<AccordionItem value="regional-holidays" className="border-none">
							<AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
								<div className="flex items-center">
									<CalendarIcon className="mr-2 h-5 w-5 text-primary" />
									<span>Días Festivos Regionales</span>
									<Badge variant="outline" className="ml-2 bg-primary/10">
										{regionalHolidays.length}
									</Badge>
								</div>
							</AccordionTrigger>
							<AccordionContent className="px-4 pb-4">
								<Alert className="mb-3">
									<div className="flex items-center">
										<AlertTriangle className="h-4 w-4 mr-2" />
										<AlertTitle>Atención</AlertTitle>
									</div>
									<AlertDescription>
										Los festivos regionales pueden variar según la comunidad autónoma. Podrás personalizarlos
										próximamente.
									</AlertDescription>
								</Alert>

								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Fecha</TableHead>
											<TableHead>Día</TableHead>
											<TableHead>Nombre</TableHead>
											<TableHead>Región</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{regionalHolidays.length > 0 ? (
											regionalHolidays.map((holiday) => (
												<TableRow key={`${holiday.name}-${holiday.date}`}>
													<TableCell className="whitespace-nowrap">{formatFullDate(holiday.date)}</TableCell>
													<TableCell className="whitespace-nowrap">{getWeekday(holiday.date)}</TableCell>
													<TableCell>{holiday.name}</TableCell>
													<TableCell>{holiday.location}</TableCell>
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell colSpan={4} className="text-center text-muted-foreground">
													No hay festivos regionales configurados
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default HolidaysSummary;
