import { Skeleton } from "@modules/components/core/skeleton/Skeleton";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { type CSSProperties, type ComponentProps, useMemo } from "react";

export const SidebarMenuSkeleton = ({
	className,
	showIcon = false,
	...props
}: ComponentProps<"div"> & {
	showIcon?: boolean;
}) => {
	const width = useMemo(() => {
		return `${Math.floor(Math.random() * 40) + 50}%`;
	}, []);

	return (
		<div
			data-slot="sidebar-menu-skeleton"
			data-sidebar="menu-skeleton"
			className={mergeClasses("flex h-8 items-center gap-2 rounded-md px-2", className)}
			{...props}
		>
			{showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
			<Skeleton
				className="h-4 max-w-(--skeleton-width) flex-1"
				data-sidebar="menu-skeleton-text"
				style={
					{
						"--skeleton-width": width,
					} as CSSProperties
				}
			/>
		</div>
	);
};
