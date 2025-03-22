import { isWeekend } from 'date-fns';

interface IsPTOLimitReachedParams {
	selectedDays: Date[];
	ptoDays: number;
	isHoliday: (date: Date) => boolean;
}

interface IsPTOLimitReachedReturn {
	limitReached: boolean;
	message: string | null;
}

export function isPTOLimitReached({
	selectedDays,
	ptoDays,
	isHoliday,
}: IsPTOLimitReachedParams): IsPTOLimitReachedReturn {
	const currentPtoDays = selectedDays.filter((day) => !isWeekend(day) && !isHoliday(day)).length;

	if (currentPtoDays >= ptoDays) {
		return {
			limitReached: true,
			message: `No puedes seleccionar más de ${ptoDays} días PTO. Quita algún día para poder seleccionar otros.`,
		};
	}

	return { limitReached: false, message: null };
}
