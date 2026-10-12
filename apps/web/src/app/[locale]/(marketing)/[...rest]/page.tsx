import { notFoundMetadata } from "@infrastructure/seo/notFoundMetadata";
import { notFound } from "next/navigation";

export const generateMetadata = notFoundMetadata;

export default function UnknownPage(): never {
	notFound();
}
