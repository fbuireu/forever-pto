import { cn } from "@ui/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const badgeVariants = cva(
	"hit-area-stable inline-flex items-center justify-center rounded-full border-[3px] border-[var(--frame)] px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.08em] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive transition-all duration-75 ease-linear hit-area-stable shadow-[var(--shadow-brutal-xs)]",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground",
				secondary: "bg-secondary text-secondary-foreground",
				destructive: "bg-destructive text-on-fill",
				outline: "bg-[var(--surface-panel)] text-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({ className, variant, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
