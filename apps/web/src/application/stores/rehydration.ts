import { logClientError } from "@application/shared/utils/clientLog";

interface RehydrateFailureParams {
	storeName: string;
	error: unknown;
	state: unknown;
}

export const onRehydrateFailure = ({ storeName, error, state }: RehydrateFailureParams): void => {
	logClientError({ message: `Error rehydrating ${storeName}`, error, context: { storeName, hasState: !!state } });
	globalThis.localStorage?.removeItem(storeName);
};
