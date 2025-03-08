import type { HolidayDTO } from '@/application/dto/holiday/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type React from 'react';

interface HolidaysSummaryProps {
    holidays: HolidayDTO[];
}

const HolidaysSummary: React.FC<HolidaysSummaryProps> = ({ holidays }) => {
    const nationalHolidays = holidays.filter((holiday) => !holiday.location);
    const regionalHolidays = holidays.filter((holiday) => holiday.location);

    const formatFullDate = (date: Date) => {
        return format(date, 'dd MMMM yyyy', { locale: es });
    };

    const getWeekday = (date: Date) => {
        return format(date, 'EEEE', { locale: es });
    };

    return (
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Accordion type="single" collapsible className="rounded-md border shadow-sm">
                    <AccordionItem value="national" className="border-none">
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
                            <Alert variant="destructive" className="mb-3">
                                <AlertDescription className="text-xs">
                                    Los festivos mostrados pueden ser incorrectos. Podrás modificarlos próximamente para
                                    ajustarlos a tus
                                    necesidades.
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
                                                        <TableCell className="whitespace-nowrap">{formatFullDate(
                                                                holiday.date)}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{getWeekday(
                                                                holiday.date)}</TableCell>
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
                <Accordion type="single" collapsible className="rounded-md border shadow-sm">
                    <AccordionItem value="regional" className="border-none">
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
                            <Alert variant="destructive" className="mb-3">
                                <AlertDescription className="text-xs">
                                    Los festivos regionales pueden variar según la comunidad autónoma. Podrás
                                    personalizarlos próximamente.
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
                                            regionalHolidays.map((holiday, index) => (
                                                    <TableRow key={`${holiday.name}-${holiday.date}`}> <TableCell
                                                            className="whitespace-nowrap">{formatFullDate(
                                                            holiday.date)}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{getWeekday(
                                                                holiday.date)}</TableCell>
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
            </div>
    );
};

export default HolidaysSummary;
