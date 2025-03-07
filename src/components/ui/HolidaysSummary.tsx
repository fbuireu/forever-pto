import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { HolidayDTO } from '@/application/dto/holiday/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon } from 'lucide-react';

interface HolidaysSummaryProps {
  holidays: HolidayDTO[];
}

const HolidaysSummary: React.FC<HolidaysSummaryProps> = ({ holidays }) => {
  const nationalHolidays = holidays.filter(holiday => !holiday.location);
  const regionalHolidays = holidays.filter(holiday => holiday.location);
console.log(holidays);
  const formatFullDate = (date: Date) => {
    return format(date, 'dd MMMM yyyy', { locale: es });
  };

  const getWeekday = (date: Date) => {
    const weekday = format(date, 'EEEE', { locale: es });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  };

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Accordion type="single" collapsible defaultValue="national" className="border rounded-md shadow-sm">
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
              <Alert variant="warning" className="mb-3">
                <AlertDescription className="text-xs">
                  Los festivos mostrados pueden ser incorrectos. Podrás modificarlos próximamente para ajustarlos a tus necesidades.
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
                      nationalHolidays.map((holiday, index) => (
                          <TableRow key={`national-${index}`}>
                            <TableCell className="whitespace-nowrap">
                              {formatFullDate(holiday.date)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {getWeekday(holiday.date)}
                            </TableCell>
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
        <Accordion type="single" collapsible defaultValue="regional" className="border rounded-md shadow-sm">
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
              <Alert variant="warning" className="mb-3">
                <AlertDescription className="text-xs">
                  Los festivos regionales pueden variar según la comunidad autónoma. Podrás personalizarlos próximamente.
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
                          <TableRow key={`regional-${index}`}>
                            <TableCell className="whitespace-nowrap">
                              {formatFullDate(holiday.date)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {getWeekday(holiday.date)}
                            </TableCell>
                            <TableCell>{holiday.name}</TableCell>
                            <TableCell>
                              {holiday.location}
                            </TableCell>
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