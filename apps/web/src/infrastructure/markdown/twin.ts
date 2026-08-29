export const MARKDOWN_ROUTE = "/api/markdown";
export const MARKDOWN_ACCEPT = "text/markdown";
export const MARKDOWN_PATH_HEADER = "x-markdown-path";

const VARY = "Accept";
const FOUND_CACHE_CONTROL = "public, max-age=3600";
const MISSING_CACHE_CONTROL = "no-store";

interface MarkdownTwinHeadersParams {
	found: boolean;
}

export const markdownTwinHeaders = ({ found }: MarkdownTwinHeadersParams): Record<string, string> => ({
	"Content-Type": found ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8",
	"Cache-Control": found ? FOUND_CACHE_CONTROL : MISSING_CACHE_CONTROL,
	Vary: VARY,
});
