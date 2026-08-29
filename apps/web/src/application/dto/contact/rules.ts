const ALIAS = /\+[^@]*(?=@)/;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export const CONTACT_COOLDOWN_HOURS = 24;

export interface ContactCooldownStartParams {
	now: Date;
	hours?: number;
}

export const contactSenderKey = (email: string): string => email.trim().toLowerCase().replace(ALIAS, "");

export const contactCooldownStart = ({ now, hours = CONTACT_COOLDOWN_HOURS }: ContactCooldownStartParams): string =>
	new Date(now.getTime() - hours * MILLISECONDS_PER_HOUR).toISOString();
