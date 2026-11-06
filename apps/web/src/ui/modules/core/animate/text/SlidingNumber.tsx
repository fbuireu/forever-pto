"use client";

import { cn } from "@ui/utils/cn";
import { type MotionValue, m, type SpringOptions, useSpring, useTransform } from "motion/react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import useMeasure from "react-use-measure";

const TRANSITION: SpringOptions = { stiffness: 200, damping: 20, mass: 0.4 };

const decimalSeparatorCache = new Map<string, string>();

function getDecimalSeparator(locale: string): string {
	return decimalSeparatorCache.getOrInsertComputed(
		locale,
		() => new Intl.NumberFormat(locale).formatToParts(1.1).find(({ type }) => type === "decimal")?.value ?? ".",
	);
}

interface SlidingNumberDisplayProps {
	motionValue: MotionValue<number>;
	number: number;
	height: number;
	transition: SpringOptions;
}

function SlidingNumberDisplay({ motionValue, number, height, transition }: Readonly<SlidingNumberDisplayProps>) {
	const y = useTransform(motionValue, (latest) => {
		if (!height) return 0;
		const currentNumber = latest % 10;
		const offset = (10 + number - currentNumber) % 10;
		let translateY = offset * height;
		if (offset > 5) translateY -= 10 * height;
		return translateY;
	});

	if (!height) {
		return <span className="invisible absolute">{number}</span>;
	}

	return (
		<m.span
			data-slot="sliding-number-display"
			style={{ y }}
			className="absolute inset-0 flex items-center justify-center"
			transition={{ ...transition, type: "spring" }}
		>
			{number}
		</m.span>
	);
}

interface SlidingNumberRollerProps {
	prevValue: number;
	value: number;
	place: number;
	transition: SpringOptions;
}

function SlidingNumberRoller({ prevValue, value, place, transition }: Readonly<SlidingNumberRollerProps>) {
	const startNumber = Math.floor(prevValue / place) % 10;
	const targetNumber = Math.floor(value / place) % 10;
	const animatedValue = useSpring(startNumber, transition);

	useEffect(() => {
		animatedValue.set(targetNumber);
	}, [targetNumber, animatedValue]);

	const [measureRef, { height }] = useMeasure();

	return (
		<span
			ref={measureRef}
			data-slot="sliding-number-roller"
			className="relative inline-block w-[1ch] overflow-hidden leading-none tabular-nums"
		>
			<span className="invisible">0</span>
			{([0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((digit) => (
				<SlidingNumberDisplay
					key={digit}
					motionValue={animatedValue}
					number={digit}
					height={height}
					transition={TRANSITION}
				/>
			))}
		</span>
	);
}

interface SlidingNumberProps {
	number: number | string;
	className?: string;
	padStart?: boolean;
	decimalPlaces?: number;
	"aria-hidden"?: "true";
}

function SlidingNumber({
	number,
	className,
	padStart = false,
	decimalPlaces = 0,
	"aria-hidden": ariaHidden,
}: SlidingNumberProps) {
	const separator = getDecimalSeparator(useLocale());

	const effectiveNumber = Math.abs(Number(number));
	const [shown, setShown] = useState({ number: effectiveNumber, previous: 0 });

	if (shown.number !== effectiveNumber) {
		setShown({ number: effectiveNumber, previous: shown.number });
	}

	const formatNumber = useCallback(
		(num: number) => (decimalPlaces != null ? num.toFixed(decimalPlaces) : num.toString()),
		[decimalPlaces],
	);

	const numberStr = formatNumber(effectiveNumber);
	const [newIntStrRaw, newDecStrRaw = ""] = numberStr.split(".");
	const newIntStr = padStart && newIntStrRaw?.length === 1 ? `0${newIntStrRaw}` : newIntStrRaw;

	const prevFormatted = formatNumber(shown.previous);
	const [prevIntStrRaw = "", prevDecStrRaw = ""] = prevFormatted.split(".");
	const prevIntStr = padStart && prevIntStrRaw.length === 1 ? `0${prevIntStrRaw}` : prevIntStrRaw;

	const adjustedPrevInt = useMemo(() => {
		return prevIntStr.length > (newIntStr?.length ?? 0)
			? prevIntStr.slice(-(newIntStr?.length ?? 0))
			: prevIntStr.padStart(newIntStr?.length ?? 0, "0");
	}, [prevIntStr, newIntStr]);

	const adjustedPrevDec = useMemo(() => {
		if (!newDecStrRaw) return "";
		return prevDecStrRaw.length > newDecStrRaw.length
			? prevDecStrRaw.slice(0, newDecStrRaw.length)
			: prevDecStrRaw.padEnd(newDecStrRaw.length, "0");
	}, [prevDecStrRaw, newDecStrRaw]);

	const intDigitCount = newIntStr?.length ?? 0;
	const intPlaces = useMemo(
		() => Array.from({ length: intDigitCount }, (_, i) => 10 ** (intDigitCount - i - 1)),
		[intDigitCount],
	);
	const decPlaces = useMemo(
		() =>
			newDecStrRaw ? Array.from({ length: newDecStrRaw.length }, (_, i) => 10 ** (newDecStrRaw.length - i - 1)) : [],
		[newDecStrRaw],
	);

	const newDecValue = newDecStrRaw ? Number.parseInt(newDecStrRaw, 10) : 0;
	const prevDecValue = adjustedPrevDec ? Number.parseInt(adjustedPrevDec, 10) : 0;

	return (
		<span data-slot="sliding-number" className={cn("flex items-center", className)} aria-hidden={ariaHidden}>
			{Number(number) < 0 && <span className="mr-1">-</span>}

			{intPlaces.map((place) => (
				<SlidingNumberRoller
					key={`int-${place}`}
					prevValue={Number.parseInt(adjustedPrevInt, 10)}
					value={Number.parseInt(newIntStr ?? "0", 10)}
					place={place}
					transition={TRANSITION}
				/>
			))}

			{newDecStrRaw && (
				<>
					<span>{separator}</span>
					{decPlaces.map((place) => (
						<SlidingNumberRoller
							key={`dec-${place}`}
							prevValue={prevDecValue}
							value={newDecValue}
							place={place}
							transition={TRANSITION}
						/>
					))}
				</>
			)}
		</span>
	);
}

export { SlidingNumber };
