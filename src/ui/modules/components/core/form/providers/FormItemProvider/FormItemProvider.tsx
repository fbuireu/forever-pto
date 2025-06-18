import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { type ComponentProps, createContext, useId, useMemo } from "react";

type FormItemContextValue = {
	id: string;
};

export const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

export function FormItemProvider({ className, ...props }: ComponentProps<"div">) {
	const id = useId();

	const contextValue = useMemo(() => ({ id }), [id]);

	return (
		<FormItemContext.Provider value={contextValue}>
			<div data-slot="form-item" className={mergeClasses("grid gap-2", className)} {...props} />
		</FormItemContext.Provider>
	);
}
