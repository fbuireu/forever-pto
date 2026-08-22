export const emailDomain = (email: string | null | undefined): string | undefined => email?.split("@")[1];
