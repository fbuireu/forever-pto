import { DialogOverlay } from "@modules/components/core/dialog/atoms/dialogOverlay/DialogOverlay";
import { DialogPortal } from "@modules/components/core/dialog/atoms/dialogPortal/DialogPortal";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { X } from "lucide-react";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

export const DialogContent = forwardRef<
	ComponentRef<typeof DialogPrimitive.Content>,
	ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			ref={ref}
			className={mergeClasses(
				"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
				className,
			)}
			{...props}
		>
			{children}
			<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
				<X className="h-4 w-4" />
				<span className="sr-only">Close</span>
			</DialogPrimitive.Close>
		</DialogPrimitive.Content>
	</DialogPortal>
));

DialogContent.displayName = DialogPrimitive.Content.displayName;
