'use client';

import { cn } from '@ui/lib/utils';
import type { ComponentProps } from 'react';

function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div
      data-slot='table-container'
      className='relative w-full overflow-x-auto rounded-[1.2rem] border-[2.5px] border-[var(--frame)] bg-card shadow-[var(--shadow-brutal-md)]'
    >
      <table data-slot='table' className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return (
    <thead
      data-slot='table-header'
      className={cn(
        '[&_tr]:border-b-[2.5px] [&_tr]:border-[var(--frame)] [&_tr]:bg-primary [&_tr]:text-primary-foreground',
        className
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody data-slot='table-body' className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

function TableFooter({ className, ...props }: ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot='table-footer'
      className={cn(
        'bg-secondary border-t-[2.5px] border-[var(--frame)] font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      data-slot='table-row'
      className={cn(
        'border-b-[2px] border-[var(--frame)]/18 transition-colors odd:bg-[var(--surface-panel-soft)] hover:bg-[var(--surface-panel-alt)] data-[state=selected]:bg-[var(--surface-panel-alt)]',
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        'h-11 px-3 text-left align-middle text-xs font-black uppercase tracking-[0.08em] whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return (
    <td
      data-slot='table-cell'
      className={cn(
        'p-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return (
    <caption data-slot='table-caption' className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />
  );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
