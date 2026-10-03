"use client";

import { useState } from "react";

interface UseHasOpenedParams {
	open: boolean;
}

export const useHasOpened = ({ open }: UseHasOpenedParams) => {
	const [hasOpened, setHasOpened] = useState(open);

	if (open && !hasOpened) setHasOpened(true);

	return hasOpened || open;
};
