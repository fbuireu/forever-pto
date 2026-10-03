import { logClientError } from "@application/shared/utils/clientLog";

interface OnRehydrateFailureParams {
	storeName: string;
	error: unknown;
	state: unknown;
}

export const onRehydrateFailure = ({ storeName, error, state }: OnRehydrateFailureParams): void => {
	logClientError({ message: `Error rehydrating ${storeName}`, error, context: { storeName, hasState: !!state } });
	globalThis.localStorage?.removeItem(storeName);
};
