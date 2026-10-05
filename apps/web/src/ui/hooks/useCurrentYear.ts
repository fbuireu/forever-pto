"use client";

import { useEffect, useState } from "react";

export const useCurrentYear = (serverYear: number) => {
	const [year, setYear] = useState(serverYear);

	useEffect(() => {
		setYear(new Date().getFullYear());
	}, []);

	return year;
};
