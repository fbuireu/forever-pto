"use client";

import { useHasOpened } from "@ui/hooks/useHasOpened";
import dynamic from "next/dynamic";

const ContactModal = dynamic(() => import("./ContactModal").then((module) => ({ default: module.ContactModal })));

interface LazyContactModalProps {
	open: boolean;
	onClose: () => void;
}

export const LazyContactModal = ({ open, onClose }: LazyContactModalProps) => {
	const hasOpened = useHasOpened(open);

	return hasOpened ? <ContactModal open={open} onClose={onClose} /> : null;
};
