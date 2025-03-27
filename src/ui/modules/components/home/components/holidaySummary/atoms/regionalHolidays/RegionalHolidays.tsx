import type { HolidayDTO } from '@application/dto/holiday/types';
import { Accordion } from '@modules/components/core/accordion/Accordion';
import { Alert } from '@modules/components/core/alert/Alert';
import { AlertDescription } from '@modules/components/core/alert/atoms/alertDescription/AlertDescription';
import { AlertTitle } from '@modules/components/core/alert/atoms/alertTitle/AlertTitle';
import { Badge } from '@modules/components/core/badge/Badge';
import { Table } from '@modules/components/core/table/Table';
import { TableHead } from '@modules/components/core/table/atoms/tablHead/TableHead';
import { TableBody } from '@modules/components/core/table/atoms/tableBody/TableBody';
import { TableCell } from '@modules/components/core/table/atoms/tableCell/TableCell';
import { TableHeader } from '@modules/components/core/table/atoms/tableHeader/TableHeader';
import { TableRow } from '@modules/components/core/table/atoms/tableRow/TableRow';
import { TabsContent } from '@modules/components/core/tabs/atoms/tabsContent/TabsContent';
import { formatFullDate } from '@modules/components/home/components/holidaySummary/utils/formatFullDate/formatFullDate';
import { getWeekday } from '@modules/components/home/components/holidaySummary/utils/getWeekDay/getWeekDay';
import { AlertTriangle, CalendarIcon } from 'lucide-react';
import { AccordionItem } from '@modules/components/core/accordion/atoms/accordionItem/AccordionItem';
import { AccordionTrigger } from '@modules/components/core/accordion/atoms/accordionTrigger/AccordionTrigger';
import { AccordionContent } from '@modules/components/core/accordion/atoms/accordionContent/AccordionContent';

interface RegionalHolidaysProps {
  regionalHolidays: HolidayDTO[];
}

export const RegionalHolidays = ({ regionalHolidays }: RegionalHolidaysProps) => (
    <TabsContent value="regional-holidays">
      <Accordion type="single" collapsible className="rounded-md border shadow-xs" disabled={!regionalHolidays.length}>
        <AccordionItem value="regional-holidays" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 w-full">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
              <span>Días Festivos Nacionales</span>
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
                Los festivos mostrados pueden ser incorrectos. Podrás modificarlos próximamente para ajustarlos a tus
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
                {regionalHolidays.length > 0 ? (
                    regionalHolidays.map((holiday) => (
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
);
