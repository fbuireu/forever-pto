import { routing } from "@infrastructure/i18n/routing";
import createMiddleware from "next-intl/middleware";

export default createMiddleware(routing);
