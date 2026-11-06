const ALIAS = /\+[^@]*(?=@)/;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

const CONTACT_COOLDOWN_HOURS = 24;

export const contactSenderKey = (email: string): string => email.trim().toLowerCase().replace(ALIAS, "");

export const contactCooldownStart = (now: Date): string =>
	new Date(now.getTime() - CONTACT_COOLDOWN_HOURS * MILLISECONDS_PER_HOUR).toISOString();
