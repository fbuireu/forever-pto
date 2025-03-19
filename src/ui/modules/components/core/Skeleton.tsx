import { mergeClasses } from '@shared/ui/utils/mergeClasses';
import { type HTMLAttributes } from 'react';

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={mergeClasses("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
}

export { Skeleton };
