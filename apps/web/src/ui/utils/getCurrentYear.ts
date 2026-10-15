export async function getCurrentYear(): Promise<number> {
	return new Date().getFullYear();
}
