"use client";

import { cn } from "@ui/utils/cn";
import { getStrictContext } from "@ui/utils/context";
import { type ComponentProps, useEffect, useId, useMemo, useState } from "react";
import {
	Controller,
	type ControllerFieldState,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
	FormProvider,
	useFormContext,
	useFormState,
} from "react-hook-form";
import { Slot } from "../animate/base/Slot";
import { Label } from "./Label";

const Form = FormProvider;

interface FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	name: TName;
}

const [FormFieldProvider, useFormFieldContext] = getStrictContext<FormFieldContextValue>("<FormField>");

interface FormItemContextValue {
	id: string;
	hasDescription: boolean;
	registerDescription: (present: boolean) => void;
}

const [FormItemProvider, useFormItemContext] = getStrictContext<FormItemContextValue>("<FormItem>");

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
	TTransformedValues = TFieldValues,
>({
	...props
}: ControllerProps<TFieldValues, TName, TTransformedValues>) => {
	const fieldContextValue = useMemo(() => ({ name: props.name }), [props.name]);
	return (
		<FormFieldProvider value={fieldContextValue}>
			<Controller {...props} />
		</FormFieldProvider>
	);
};

interface FormFieldState extends FormItemContextValue, ControllerFieldState {
	name: string;
	formItemId: string;
	formDescriptionId: string;
	formMessageId: string;
}

const useFormField = (): FormFieldState => {
	const fieldContext = useFormFieldContext();
	const itemContext = useFormItemContext();
	const { getFieldState } = useFormContext();
	const formState = useFormState({ name: fieldContext.name });
	const fieldState = getFieldState(fieldContext.name, formState);

	const { id, hasDescription, registerDescription } = itemContext;

	return {
		id,
		name: fieldContext.name,
		hasDescription,
		registerDescription,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};

function FormItem({ className, ...props }: ComponentProps<"div">) {
	const id = useId();
	const [hasDescription, setHasDescription] = useState(false);

	const itemContextValue = useMemo(
		() => ({ id, hasDescription, registerDescription: setHasDescription }),
		[id, hasDescription],
	);
	return (
		<FormItemProvider value={itemContextValue}>
			<div data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
		</FormItemProvider>
	);
}

function FormLabel({ className, ...props }: Omit<ComponentProps<"label">, "htmlFor">) {
	const { error, formItemId } = useFormField();

	return (
		<Label
			data-slot="form-label"
			data-error={!!error}
			className={cn("data-[error=true]:text-destructive", className)}
			htmlFor={formItemId}
			{...props}
		/>
	);
}

function FormHeading({ className, ...props }: ComponentProps<"p">) {
	const { error } = useFormField();

	return (
		<p
			data-slot="form-heading"
			data-error={!!error}
			className={cn("text-sm font-medium leading-none data-[error=true]:text-destructive", className)}
			{...props}
		/>
	);
}

function FormControl({ ...props }: ComponentProps<typeof Slot>) {
	const { error, hasDescription, formItemId, formDescriptionId, formMessageId } = useFormField();
	const describedBy = [hasDescription ? formDescriptionId : null, error ? formMessageId : null]
		.filter(Boolean)
		.join(" ");

	return (
		<Slot
			data-slot="form-control"
			id={formItemId}
			aria-describedby={describedBy || undefined}
			aria-invalid={!!error}
			{...props}
		/>
	);
}

function FormDescription({ className, ...props }: ComponentProps<"p">) {
	const { formDescriptionId, registerDescription } = useFormField();

	useEffect(() => {
		registerDescription(true);
		return () => registerDescription(false);
	}, [registerDescription]);

	return (
		<p
			data-slot="form-description"
			id={formDescriptionId}
			className={cn("text-muted-foreground text-xs", className)}
			{...props}
		/>
	);
}

function FormMessage({ className, ...props }: ComponentProps<"p">) {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error?.message ?? "") : props.children;

	if (!body) {
		return null;
	}

	return (
		<p
			data-slot="form-message"
			id={formMessageId}
			role="alert"
			className={cn("text-destructive text-sm", className)}
			{...props}
		>
			{body}
		</p>
	);
}

export { Form, FormControl, FormDescription, FormField, FormHeading, FormItem, FormLabel, FormMessage };
