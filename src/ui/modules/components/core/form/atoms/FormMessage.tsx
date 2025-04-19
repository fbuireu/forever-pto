import { useFormField } from "@modules/components/core/form/hooks/useFormField";
import { mergeClasses } from "@ui/utils/mergeClasses";
import type { ComponentProps } from "react";

export function FormMessage({ className, ...props }: ComponentProps<"p">) {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error?.message ?? "") : props.children;

	if (!body) {
		return null;
	}

	return (
		<p
			data-slot="form-message"
			id={formMessageId}
			className={mergeClasses("text-destructive text-sm", className)}
			{...props}
		>
			{body}
		</p>
	);
}
