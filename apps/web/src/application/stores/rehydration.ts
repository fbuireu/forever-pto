import { logClientError } from "@application/shared/utils/clientLog";

interface RehydrateFailureParams {
	storeName: string;
	error: unknown;
	state: unknown;
}

export const onRehydrateFailure = ({ storeName, error, state }: RehydrateFailureParams): void => {
	logClientError(`Error rehydrating ${storeName}`, error, { storeName, hasState: !!state });
	globalThis.localStorage?.removeItem(storeName);
};
