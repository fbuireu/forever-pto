import { generateMetadata } from "./metadata";

export const runtime = "edge";

const ForeverPto = async ({ params }: {params: any}) => {
    const { locale } = await params;

	return (
		"hello world" + locale
	);
};

export default ForeverPto;
export { generateMetadata };

// TODO:
// 2- migrate to eslint
// 2- performance (if a component needs to be client usew tanstack)
// 2- error boundary, analytics
// 2- improve SEO (a11y)
// 2- change biome commands to eslint
// 2- favicon

// 2- legal pages and cookies
// 2- configure CI releases
// 2- add slider for mobile calendars
// 2- change spinner for skeleton
// 2- refine styles (hover blocks, dark mode, modals, calendar, days etc).
// 35- Check copies (what is premium, limitations, behind flag features, etc)
// 34- Ko-Fi BE integration (webhook not working on localhost)
// 34- QA (what happens if there are less days than remaining)
// 1- recheck and refactor
// 2- change style to circle days (like pencil)
// 6- Add tests (also e2e)
// 9- Add CI/CD
// 10- repo settings and rules (README, etc)
// 34- MCP server? (paid func)
// 34- Readme
// 34- migrate astro
// 35- Replace kofi for stripe
// 35- allow the user to select score stragety
// 36- https://animate-ui.com/
// 24- Edit weekends (paid functionality). Edit days (add and remove days) (paid functionality)
// 24- Resend for contact
