"use client";

import { useState } from "react";

export const useHasOpened = (open: boolean): boolean => {
	const [hasOpened, setHasOpened] = useState(open);

	if (open && !hasOpened) setHasOpened(true);

	return hasOpened || open;
};
