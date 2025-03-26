import { mergeClasses } from '@ui/utils/mergeClasses';
import { forwardRef, type HTMLAttributes } from 'react';

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={mergeClasses('w-full caption-bottom text-sm', className)} {...props} />
    </div>
));
