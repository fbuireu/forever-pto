import { NotFoundContent } from "@ui/modules/pages/not-found/NotFoundContent";
import { getLocale } from "next-intl/server";

export default async function NotFound() {
	return <NotFoundContent locale={await getLocale()} />;
}
