const DEFAULT_TIMEZONE = "UTC";

export function getUserTimezone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
	} catch {
		return DEFAULT_TIMEZONE;
	}
}
