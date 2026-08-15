import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/modules/core/primitives/Table';
import { Demo } from '../Demo';

const HOLIDAYS = [
  { id: 'new-year', name: 'New Year', date: 'Jan 1', scope: 'National' },
  { id: 'st-george', name: 'Sant Jordi', date: 'Apr 23', scope: 'Regional' },
  { id: 'assumption', name: 'Assumption', date: 'Aug 15', scope: 'National' },
  { id: 'team-offsite', name: 'Team offsite', date: 'Sep 12', scope: 'Custom' },
];

export const TableDemo = () => (
  <Demo>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Holiday</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Scope</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {HOLIDAYS.map(({ id, name, date, scope }) => (
          <TableRow key={id}>
            <TableCell>{name}</TableCell>
            <TableCell>{date}</TableCell>
            <TableCell>{scope}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Demo>
);
