import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { type ComponentProps, createContext, useId } from "react";

type FormItemContextValue = {
	id: string;
};

const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

export function FormItemProvider({ className, ...props }: ComponentProps<"div">) {
	const id = useId();

	return (
		<FormItemContext.Provider value={{ id }}>
			<div data-slot="form-item" className={mergeClasses("grid gap-2", className)} {...props} />
		</FormItemContext.Provider>
	);
}

export { FormItemContext };
