import { MergeClasses } from '@shared/ui/utils/mergeClasses';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={MergeClasses("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
}

export { Skeleton };
