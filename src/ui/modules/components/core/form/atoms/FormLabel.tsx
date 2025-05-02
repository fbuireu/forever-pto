import { useFormField } from "@modules/components/core/form/hooks/useFormField";
import { Label } from "@modules/components/core/label/Label";
import type * as LabelPrimitive from "@radix-ui/react-label";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { ComponentProps } from "react";

export function FormLabel({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
	const { error, formItemId } = useFormField();

	return (
		<Label
			data-slot="form-label"
			data-error={!!error}
			className={mergeClasses("data-[error=true]:text-destructive", className)}
			htmlFor={formItemId}
			{...props}
		/>
	);
}
