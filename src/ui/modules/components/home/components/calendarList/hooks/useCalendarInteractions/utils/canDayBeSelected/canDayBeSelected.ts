import { isWeekend } from 'date-fns';

interface CanDayBeSelectedParams {
	date: Date;
	isHoliday: (date: Date) => boolean;
	isPastDayAllowed: () => boolean;
}

interface CanDayBeSelectedReturn {
	canSelect: boolean;
	message: string | null;
}

export function canDayBeSelected({
	date,
	isHoliday,
	isPastDayAllowed,
}: CanDayBeSelectedParams): CanDayBeSelectedReturn {
	if (isWeekend(date) || isHoliday(date)) {
		return { canSelect: false, message: null };
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (!isPastDayAllowed() && date < today) {
		return {
			canSelect: false,
			message: "No puedes seleccionar días pasados. Activa la opción 'Permitir seleccionar días pasados' si lo deseas.",
		};
	}

	return { canSelect: true, message: null };
}
