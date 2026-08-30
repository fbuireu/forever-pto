import { unstable_isUnrecognizedActionError } from "next/navigation";

export const recoverFromStaleDeployment = (error: unknown): boolean => {
	if (!unstable_isUnrecognizedActionError(error)) return false;

	globalThis.location.reload();

	return true;
};
