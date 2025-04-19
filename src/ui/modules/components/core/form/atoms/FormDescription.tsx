import { useFormField } from "@modules/components/core/form/hooks/useFormField";
import { mergeClasses } from "@ui/utils/mergeClasses";
import type { ComponentProps } from "react";

export function FormDescription({ className, ...props }: ComponentProps<"p">) {
	const { formDescriptionId } = useFormField();

	return (
		<p
			data-slot="form-description"
			id={formDescriptionId}
			className={mergeClasses("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}
