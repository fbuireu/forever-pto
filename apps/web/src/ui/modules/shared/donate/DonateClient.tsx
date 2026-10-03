"use client";

import dynamic from "next/dynamic";
import type { DonateProps } from "./Donate";

const Donate = dynamic(() => import("./Donate").then((module) => ({ default: module.Donate })), {
	ssr: false,
});

export function DonateClient({ bottomClassName }: DonateProps) {
	return <Donate bottomClassName={bottomClassName} />;
}
