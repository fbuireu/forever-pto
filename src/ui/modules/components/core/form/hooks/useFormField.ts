import { FormFieldContext } from "@modules/components/core/form/providers/FormFieldProvider/FormFieldProvider";
import { FormItemContext } from "@modules/components/core/form/providers/FormItemProvider/FormItemProvider";
import { useContext } from "react";
import { useFormContext, useFormState } from "react-hook-form";

export const useFormField = () => {
	const fieldContext = useContext(FormFieldContext);
	const itemContext = useContext(FormItemContext);
	const { getFieldState } = useFormContext();
	const formState = useFormState({ name: fieldContext.name });
	const fieldState = getFieldState(fieldContext.name, formState);

	if (!fieldContext) {
		throw new Error("useFormField should be used within <FormField>");
	}

	const { id } = itemContext;

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};
