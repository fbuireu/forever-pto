"use client";

import { NumberField } from "@base-ui/react/number-field";
import { intlLocaleOf, readLocalizedNumber } from "@ui/utils/localizedNumber";
import { type ComponentProps, cloneElement, type ReactElement, useEffect, useEffectEvent, useReducer } from "react";
import { Input } from "./Input";

const TYPED_REASONS = new Set(["input-change", "input-clear", "input-paste", "input-blur"]);

interface ReadingFieldProps {
	element: ReactElement;
	fieldProps: ComponentProps<"input">;
	text: string;
	value: number | null;
	locale: string;
	onValueChange: (value: number | null) => void;
}

function ReadingField({ element, fieldProps, text, value, locale, onValueChange }: ReadingFieldProps) {
	const report = useEffectEvent((typed: string) => {
		const read = readLocalizedNumber({ text: typed, locale });
		if (read !== value) onValueChange(read);
	});

	useEffect(() => {
		report(text);
	}, [text]);

	return cloneElement(element, fieldProps);
}

export interface NumberInputProps
	extends Omit<
		ComponentProps<"input">,
		"value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step" | "disabled" | "required"
	> {
	value: number | null;
	onValueChange: (value: number | null) => void;
	locale: string;
	roleDescription: string;
	maximumFractionDigits: number;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	required?: boolean;
	render?: ReactElement;
}

export function NumberInput({
	value,
	onValueChange,
	locale,
	roleDescription,
	maximumFractionDigits,
	min,
	max,
	step,
	id,
	disabled,
	required,
	render = <Input />,
	onBlur,
	ref,
	...inputProps
}: NumberInputProps) {
	const [, redraw] = useReducer((count: number) => count + 1, 0);
	const intlLocale = intlLocaleOf(locale);

	return (
		<NumberField.Root
			className="contents"
			id={id}
			value={value}
			min={min}
			max={max}
			step={step}
			snapOnStep
			allowOutOfRange
			locale={intlLocale}
			format={{ maximumFractionDigits }}
			disabled={disabled}
			required={required}
			onValueChange={(next, details) => {
				if (!TYPED_REASONS.has(details.reason)) {
					onValueChange(next);
					return;
				}
				if (details.reason !== "input-blur") return;

				const typed = details.event.target instanceof HTMLInputElement ? details.event.target.value : "";
				if (readLocalizedNumber({ text: typed, locale: intlLocale }) !== next) details.cancel();
			}}
		>
			<NumberField.Input
				{...inputProps}
				ref={ref}
				aria-roledescription={roleDescription}
				onBlur={(event) => {
					onBlur?.(event);
					redraw();
				}}
				render={(fieldProps, state) => (
					<ReadingField
						element={render}
						fieldProps={fieldProps}
						text={state.inputValue}
						value={value}
						locale={intlLocale}
						onValueChange={onValueChange}
					/>
				)}
			/>
		</NumberField.Root>
	);
}
