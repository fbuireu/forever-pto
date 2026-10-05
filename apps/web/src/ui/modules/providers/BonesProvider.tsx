"use client";
import { BONES_COLORS } from "@styles/palette";
import { configureBoneyard } from "boneyard-js/react";
import "@ui/modules/bones/registry";

configureBoneyard({
	animate: "shimmer",
	...BONES_COLORS,
	boneClass: "boneyard-bordered",
	transition: true,
});

export function BonesProvider() {
	return null;
}
