"use client";

import { useEffect, useState } from "react";

interface UseCurrentYearParams {
	serverYear: number;
}

export const useCurrentYear = ({ serverYear }: UseCurrentYearParams) => {
	const [year, setYear] = useState(serverYear);

	useEffect(() => {
		setYear(new Date().getFullYear());
	}, []);

	return year;
};
