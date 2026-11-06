"use client";

import { Switch as SwitchPrimitives } from "@base-ui/react/switch";
import { m } from "motion/react";
import type { ComponentProps } from "react";

type SwitchAccessibleName = { id: string; "aria-label"?: undefined } | { id?: undefined; "aria-label": string };

type SwitchProps = Pick<ComponentProps<typeof SwitchPrimitives.Root>, "checked" | "onCheckedChange" | "disabled"> &
	SwitchAccessibleName;

function Switch({ checked, onCheckedChange, disabled, id, "aria-label": ariaLabel }: SwitchProps) {
	return (
		<SwitchPrimitives.Root
			checked={checked}
			onCheckedChange={onCheckedChange}
			nativeButton
			disabled={disabled}
			id={id}
			render={
				<m.button
					data-slot="switch"
					whileTap="tap"
					initial={false}
					aria-label={ariaLabel}
					className="group/switch relative inline-flex h-8 w-[60px] shrink-0 cursor-pointer items-center justify-start overflow-hidden rounded-full border-[3px] border-[var(--frame)] bg-[var(--input)] p-0 shadow-[var(--shadow-brutal-3)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[color-mix(in_srgb,var(--frame)_65%,transparent_35%)] disabled:bg-[var(--muted)] disabled:shadow-[3px_3px_0_0_color-mix(in_srgb,var(--frame)_45%,transparent)]"
				/>
			}
		>
			<SwitchThumb />
		</SwitchPrimitives.Root>
	);
}

function SwitchThumb() {
	return (
		<SwitchPrimitives.Thumb
			render={
				<m.div
					data-slot="switch-thumb"
					whileTap="tap"
					initial={false}
					transition={{ duration: 0.15, ease: "linear" }}
					className="pointer-events-none absolute left-px top-px flex size-[24px] shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--frame)] bg-[var(--frame)] text-on-fill transition-all duration-75 ease-linear group-disabled/switch:opacity-50 data-[checked]:translate-x-[28px] data-[checked]:bg-[var(--accent)] data-[checked]:text-[var(--frame)]"
				/>
			}
		/>
	);
}

export { Switch };
