import { getDateFromKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateFromKey/getDateFromKey";

interface GetDaysInBlockParams {
	blockId: string;
	dayToBlockIdMap: Record<string, string>;
}

export function getDaysInBlock({ blockId, dayToBlockIdMap }: GetDaysInBlockParams): Date[] {
	const blockDayKeys = Object.entries(dayToBlockIdMap)
		.filter(([, id]) => id === blockId)
		.map(([dayKey]) => dayKey);

	return blockDayKeys.map(getDateFromKey).sort((a, b) => a.getTime() - b.getTime());
}
